import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { deleteMeasurement, listMeasurements } from '../api/measurements';
import { queryKeys } from '../api/queryKeys';
import type { Measurement } from '../api/types';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LineChart, type ChartPoint } from '../components/LineChart';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { StatusChip } from '../components/StatusChip';
import { Text } from '../components/Text';
import { usePool } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { palette } from '../theme/palette';
import { getErrorMessage } from '../utils/apiError';
import { alert } from '../utils/dialog';
import { formatDateTime } from '../utils/dates';
import { formatNumber, formatValue } from '../utils/numbers';
import { describeRange, describeStatus, isOutOfRange } from '../utils/status';

type Props = NativeStackScreenProps<AppStackParamList, 'History'>;

const PERIODS = [7, 30, 90] as const;
const DAY_MS = 86_400_000;
const MAX_POINTS = 500;

export function HistoryScreen({ route }: Props) {
  const { poolId } = route.params;
  const queryClient = useQueryClient();
  const { data: pool, isPending, error, refetch } = usePool(poolId);

  const [chosenId, setChosenId] = useState<string | undefined>(route.params.parameterId);
  const [days, setDays] = useState<number>(30);

  // Se o parâmetro pedido não existe mais na piscina, cai no primeiro da lista.
  const parameter = pool?.parameters.find((p) => p.id === chosenId) ?? pool?.parameters[0];

  const history = useQuery({
    queryKey: queryKeys.history(poolId, parameter?.id ?? '', days),
    enabled: parameter !== undefined,
    queryFn: async () => {
      // O período é fixado aqui, junto com os dados, para o gráfico e a lista usarem o mesmo intervalo.
      const to = Date.now();
      const from = to - days * DAY_MS;
      const page = await listMeasurements({
        poolId,
        parameterId: parameter?.id,
        from: new Date(from).toISOString(),
        take: MAX_POINTS,
      });
      return { items: page.items, from, to, truncated: page.pagination.hasMore };
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMeasurement(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.measurements }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pools }),
      ]);
    },
    onError: (err) => alert('Medição não apagada', getErrorMessage(err)),
  });

  const points: ChartPoint[] = useMemo(
    () =>
      [...(history.data?.items ?? [])]
        .reverse() // o servidor devolve do mais novo ao mais antigo; o gráfico vai do antigo ao novo
        .map((m) => ({ time: new Date(m.measuredAt).getTime(), value: m.value, status: m.status })),
    [history.data],
  );

  if (isPending) return <Loading label="Carregando a piscina" />;
  if (error || !pool) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }
  if (!parameter) {
    return (
      <Screen>
        <EmptyState
          title="Nenhum parâmetro escolhido"
          message="Edite a piscina e escolha o que você mede para ver o histórico."
        />
      </Screen>
    );
  }

  const items = history.data?.items ?? [];
  const outOfRange = items.filter((m) => isOutOfRange(m.status)).length;
  const summary =
    items.length === 0
      ? ''
      : `${items.length} ${items.length === 1 ? 'medição' : 'medições'}, ${outOfRange} fora da faixa. ` +
        `Última: ${formatValue(items[0]?.value ?? 0, parameter.unit)}.`;

  function confirmDelete(measurement: Measurement) {
    alert(
      'Apagar medição?',
      `${formatValue(measurement.value, parameter?.unit ?? '')} em ${formatDateTime(measurement.measuredAt)}.`,
      [
        { text: 'Manter', style: 'cancel' },
        { text: 'Apagar medição', style: 'destructive', onPress: () => remove.mutate(measurement.id) },
      ],
    );
  }

  return (
    <Screen refreshing={history.isRefetching} onRefresh={() => void history.refetch()}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-12 grow-0" contentContainerClassName="gap-2 px-2">
        {pool.parameters.map((p) => (
          <Chip 
          key={p.id} 
          label={p.name} 
          selected={p.id === parameter.id} 
          onPress={() => setChosenId(p.id)} />
        ))}

      </ScrollView>

      <View className="flex-row gap-2">
        {PERIODS.map((period) => (
          <Chip key={period} label={`${period} dias`} selected={period === days} onPress={() => setDays(period)} />
        ))}
      </View>

      {history.isPending ? (
        <View className="py-10">
          <ActivityIndicator color={palette.water} accessibilityLabel="Carregando o histórico" />
        </View>
      ) : history.error ? (
        <ErrorBanner message={getErrorMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`Sem medições de ${parameter.name}`}
          message={`Não há medições nos últimos ${days} dias. Registre uma medição ou escolha um período maior.`}
        />
      ) : (
        <>
          <Card>
            <Text variant="heading">
              {parameter.name}, últimos {days} dias
            </Text>
            <Text variant="small">{describeRange(parameter)}</Text>
            <LineChart
              points={points}
              min={parameter.min}
              max={parameter.max}
              from={history.data?.from ?? 0}
              to={history.data?.to ?? 1}
              accessibilityLabel={`Gráfico de ${parameter.name} nos últimos ${days} dias. ${summary}`}
            />
            <Text variant="small">{summary}</Text>
            {history.data?.truncated ? (
              <Text variant="small" tone="alert">
                Mostrando as {MAX_POINTS} medições mais recentes do período.
              </Text>
            ) : null}
          </Card>

          <View className="gap-2">
            {items.map((measurement) => (
              <View
                key={measurement.id}
                className="flex-row items-center justify-between gap-3 rounded-md border border-border bg-surface p-3.5"
              >
                <View className="flex-1 gap-1.5">
                  <Text variant="heading">{formatValue(measurement.value, parameter.unit)}</Text>
                  <StatusChip status={measurement.status} label={describeStatus(measurement.status, parameter)} />
                  <Text variant="small">{formatDateTime(measurement.measuredAt)}</Text>
                </View>
                <Pressable
                  onPress={() => confirmDelete(measurement)}
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar medição de ${formatNumber(measurement.value)}`}
                  hitSlop={8}
                  className="min-h-11 justify-center px-2"
                >
                  <Text variant="label" tone="alert">
                    Apagar
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
