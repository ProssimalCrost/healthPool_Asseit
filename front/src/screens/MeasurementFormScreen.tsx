import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { createMeasurements } from '../api/measurements';
import { queryKeys } from '../api/queryKeys';
import type { ReadingInput } from '../api/types';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { StatusChip } from '../components/StatusChip';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { usePool } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { parseDecimal } from '../utils/numbers';
import { describeRange, describeStatus, evaluateStatus } from '../utils/status';

type Props = NativeStackScreenProps<AppStackParamList, 'MeasurementForm'>;

export function MeasurementFormScreen({ navigation, route }: Props) {
  const { poolId } = route.params;
  const queryClient = useQueryClient();
  const { data: pool, isPending, error, refetch } = usePool(poolId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation({
    mutationFn: (readings: ReadingInput[]) => createMeasurements(poolId, readings),
    onSuccess: async () => {
      // Atualiza o cartão da piscina, a lista e os históricos.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pools }),
        queryClient.invalidateQueries({ queryKey: queryKeys.measurements }),
      ]);
      navigation.goBack();
    },
  });

  if (isPending) return <Loading label="Carregando a piscina" />;
  if (error || !pool) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const parsed = pool.parameters.map((parameter) => ({
    parameter,
    value: parseDecimal(values[parameter.id] ?? ''),
  }));
  const hasInvalid = parsed.some(({ value }) => value !== null && Number.isNaN(value));
  const filled = parsed.filter(({ value }) => value !== null && !Number.isNaN(value));

  function handleSave() {
    setSubmitted(true);
    if (hasInvalid || filled.length === 0) return;
    save.mutate(filled.map(({ parameter, value }) => ({ parameterId: parameter.id, value: value as number })));
  }

  return (
    <Screen>
      <Text tone="muted">Digite o que você mediu agora. Deixe em branco o que não mediu.</Text>

      {save.error ? <ErrorBanner message={getErrorMessage(save.error)} /> : null}
      {submitted && !hasInvalid && filled.length === 0 ? (
        <ErrorBanner message="Preencha pelo menos um valor para salvar." />
      ) : null}

      <View className="gap-5">
        {parsed.map(({ parameter, value }) => {
          const invalid = value !== null && Number.isNaN(value);
          const status = value !== null && !invalid ? evaluateStatus(value, parameter.min, parameter.max) : null;
          return (
            <View key={parameter.id} className="gap-2">
              <TextField
                label={parameter.name}
                value={values[parameter.id] ?? ''}
                onChangeText={(text) => setValues((previous) => ({ ...previous, [parameter.id]: text }))}
                keyboardType="decimal-pad"
                suffix={parameter.unit || undefined}
                hint={describeRange(parameter)}
                error={invalid ? 'Digite só números, como 7,4.' : undefined}
              />
              {status ? <StatusChip status={status} label={describeStatus(status, parameter)} /> : null}
            </View>
          );
        })}
      </View>

      <Button
        title="Salvar medição"
        onPress={handleSave}
        loading={save.isPending}
        disabled={hasInvalid}
      />
    </Screen>
  );
}
