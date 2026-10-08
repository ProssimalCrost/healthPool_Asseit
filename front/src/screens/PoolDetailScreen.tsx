import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import type { TrackedParameter } from '../api/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { StatusChip } from '../components/StatusChip';
import { Text } from '../components/Text';
import { usePool } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { formatDateTime, relativeDay } from '../utils/dates';
import { formatLiters, formatValue } from '../utils/numbers';
import { describeRange, describeStatus } from '../utils/status';

type Props = NativeStackScreenProps<AppStackParamList, 'PoolDetail'>;

export function PoolDetailScreen({ navigation, route }: Props) {
  const { poolId } = route.params;
  const { data: pool, isPending, error, refetch, isRefetching } = usePool(poolId);

  // O título vem dos parâmetros da rota; depois de editar o nome, acompanha o servidor.
  useEffect(() => {
    if (pool) navigation.setOptions({ title: pool.name });
  }, [navigation, pool]);

  if (isPending) return <Loading label="Carregando a piscina" />;

  if (error || !pool) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const lastMeasuredAt = pool.parameters
    .map((p) => p.latest?.measuredAt)
    .filter((date): date is string => date !== undefined)
    .sort()
    .at(-1);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Card className="gap-1">
        {pool.volumeLiters !== null ? <Text variant="small">Volume: {formatLiters(pool.volumeLiters)}</Text> : null}
        <Text variant="heading">
          {lastMeasuredAt ? `Última medição ${relativeDay(lastMeasuredAt)}` : 'Nenhuma medição ainda'}
        </Text>
        {lastMeasuredAt ? <Text variant="small">{formatDateTime(lastMeasuredAt)}</Text> : null}
      </Card>

      {pool.parameters.length === 0 ? (
        <EmptyState
          title="Nenhum parâmetro escolhido"
          message="Escolha o que você mede nesta piscina, como pH e cloro, para registrar medições."
        >
          <Button title="Escolher parâmetros" onPress={() => navigation.navigate('PoolForm', { poolId })} />
        </EmptyState>
      ) : (
        <>
          <View className="gap-3">
            {pool.parameters.map((parameter) => (
              <ParameterReadingCard
                key={parameter.id}
                parameter={parameter}
                onPress={() => navigation.navigate('History', { poolId, parameterId: parameter.id })}
              />
            ))}
          </View>

          <View className="gap-3">
            <Button title="Registrar medição" onPress={() => navigation.navigate('MeasurementForm', { poolId })} />
            <Button
              title="Histórico e gráfico"
              variant="secondary"
              onPress={() => navigation.navigate('History', { poolId })}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

function ParameterReadingCard({ parameter, onPress }: { parameter: TrackedParameter; onPress: () => void }) {
  const { latest } = parameter;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Abre o histórico deste parâmetro"
      className="gap-3 rounded-lg border border-border bg-surface p-4 active:bg-water-soft"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="heading">{parameter.name}</Text>
          <Text variant="small">{describeRange(parameter)}</Text>
        </View>
        <Text variant="title">{latest ? formatValue(latest.value, parameter.unit) : '–'}</Text>
      </View>

      {latest ? (
        <View className="flex-row items-center justify-between gap-2">
          <StatusChip status={latest.status} label={describeStatus(latest.status, parameter)} />
          <Text variant="small">{relativeDay(latest.measuredAt)}</Text>
        </View>
      ) : (
        <Text variant="small">Ainda sem medições</Text>
      )}
    </Pressable>
  );
}
