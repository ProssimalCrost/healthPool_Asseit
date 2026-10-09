import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { createMeasurements } from '../api/measurements';
import { queryKeys } from '../api/queryKeys';
import type { ProductUseInput, ReadingInput } from '../api/types';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { StatusChip } from '../components/StatusChip';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { usePool, useProducts } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { formatValue, parseDecimal } from '../utils/numbers';
import { describeRange, describeStatus, evaluateStatus } from '../utils/status';

type Props = NativeStackScreenProps<AppStackParamList, 'MeasurementForm'>;

export function MeasurementFormScreen({ navigation, route }: Props) {
  const { poolId } = route.params;
  const queryClient = useQueryClient();
  const { data: pool, isPending, error, refetch } = usePool(poolId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { data: products = [] } = useProducts();
  // Produtos usados nesta ida: id do produto -> quantidade digitada.
  const [used, setUsed] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (input: { readings: ReadingInput[]; products: ProductUseInput[] }) =>
      createMeasurements(poolId, input.readings, input.products),
    onSuccess: async () => {
      // Atualiza o cartão da piscina, a lista, os históricos e o estoque.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
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

  const parsedUsed = Object.entries(used).map(([productId, text]) => ({ productId, quantity: parseDecimal(text) }));
  const hasInvalidUsed = parsedUsed.some(({ quantity }) => quantity === null || Number.isNaN(quantity) || quantity <= 0);

  function toggleProduct(productId: string) {
    setUsed((previous) => {
      const { [productId]: removed, ...rest } = previous;
      return removed === undefined ? { ...previous, [productId]: '' } : rest;
    });
  }

  function handleSave() {
    setSubmitted(true);
    if (hasInvalid || hasInvalidUsed || filled.length === 0) return;
    save.mutate({
      readings: filled.map(({ parameter, value }) => ({ parameterId: parameter.id, value: value as number })),
      products: parsedUsed.map(({ productId, quantity }) => ({ productId, quantity: quantity as number })),
    });
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

      <View className="gap-3">
        <Text variant="heading">Produtos usados (opcional)</Text>
        {products.length === 0 ? (
          <Text variant="small">Cadastre produtos no estoque para registrar o que foi aplicado.</Text>
        ) : (
          <>
            <Text variant="small">
              Toque nos produtos aplicados na piscina. Eles saem do estoque e ficam salvos com a data desta medição.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="gap-2">
              {products.map((product) => (
                <Chip
                  key={product.id}
                  label={product.name}
                  selected={used[product.id] !== undefined}
                  onPress={() => toggleProduct(product.id)}
                />
              ))}
            </ScrollView>
            {products
              .filter((product) => used[product.id] !== undefined)
              .map((product) => {
                const quantity = parseDecimal(used[product.id] ?? '');
                const invalid = submitted && (quantity === null || Number.isNaN(quantity) || quantity <= 0);
                return (
                  <TextField
                    key={product.id}
                    label={`${product.name}: quantidade usada`}
                    value={used[product.id] ?? ''}
                    onChangeText={(text) => setUsed((previous) => ({ ...previous, [product.id]: text }))}
                    keyboardType="decimal-pad"
                    suffix={product.unit}
                    error={invalid ? 'Digite a quantidade usada, como 0,5.' : undefined}
                    hint={`Em estoque: ${formatValue(product.quantity, product.unit)}`}
                  />
                );
              })}
          </>
        )}
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
