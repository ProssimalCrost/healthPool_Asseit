import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createProduct, deleteProduct, updateProduct } from '../api/products';
import { queryKeys } from '../api/queryKeys';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { useProducts } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { alert } from '../utils/dialog';
import { formatNumber, parseDecimal } from '../utils/numbers';

type Props = NativeStackScreenProps<AppStackParamList, 'ProductForm'>;

interface FieldErrors {
  name?: string;
  quantity?: string;
  threshold?: string;
}

export function ProductFormScreen({ navigation, route }: Props) {
  const productId = route.params?.productId;
  const isEdit = productId !== undefined;
  const queryClient = useQueryClient();
  const productsQuery = useProducts();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const initialized = useRef(false);

  const existing = productsQuery.data?.find((p) => p.id === productId);

  useEffect(() => {
    if (initialized.current || !existing) return;
    initialized.current = true;
    setName(existing.name);
    setUnit(existing.unit);
    setQuantity(formatNumber(existing.quantity));
    setThreshold(existing.alertThreshold !== null ? formatNumber(existing.alertThreshold) : '');
  }, [existing]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.products });

  const save = useMutation({
    mutationFn: (body: { name: string; unit: string; quantity: number; alertThreshold: number | null }) =>
      isEdit ? updateProduct(productId, body) : createProduct(body),
    onSuccess: async () => {
      await refresh();
      navigation.goBack();
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteProduct(productId as string),
    onSuccess: async () => {
      await refresh();
      navigation.goBack();
    },
    onError: (error) => alert('Produto não apagado', getErrorMessage(error)),
  });

  if (productsQuery.isPending) return <Loading label="Carregando" />;
  if (productsQuery.error || !productsQuery.data) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(productsQuery.error)} onRetry={() => void productsQuery.refetch()} />
      </Screen>
    );
  }
  if (isEdit && !existing) {
    return (
      <Screen>
        <ErrorBanner message="Não encontramos este produto." />
      </Screen>
    );
  }

  function handleSave() {
    const quantityValue = parseDecimal(quantity);
    const thresholdValue = parseDecimal(threshold);
    const next: FieldErrors = {};
    if (name.trim() === '') next.name = 'Dê um nome para o produto.';
    if (quantityValue === null || Number.isNaN(quantityValue) || quantityValue < 0) {
      next.quantity = 'Digite a quantidade em estoque, como 12,5.';
    }
    if (thresholdValue !== null && (Number.isNaN(thresholdValue) || thresholdValue < 0)) {
      next.threshold = 'Digite só números, como 5.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    save.mutate({
      name: name.trim(),
      unit: unit.trim() || 'un',
      quantity: quantityValue as number,
      alertThreshold: thresholdValue,
    });
  }

  function confirmDelete() {
    alert(
      `Apagar ${existing?.name ?? 'produto'}?`,
      'O produto sai do estoque. O histórico de uso nas piscinas continua.',
      [
        { text: 'Manter produto', style: 'cancel' },
        { text: 'Apagar produto', style: 'destructive', onPress: () => remove.mutate() },
      ],
    );
  }

  const suffix = unit.trim() || 'un';

  return (
    <Screen>
      <Text tone="muted">
        Informe quanto você tem em estoque. Quando a quantidade chegar ao valor do alerta ou ficar abaixo dele, o produto
        aparece em vermelho para você repor.
      </Text>

      {save.error ? (
        <ErrorBanner message={getErrorMessage(save.error, { 409: 'Já existe um produto com este nome.' })} />
      ) : null}

      <View className="gap-4">
        <TextField label="Nome" value={name} onChangeText={setName} error={errors.name} placeholder="Ex.: Cloro granulado" maxLength={60} />
        <TextField label="Unidade" value={unit} onChangeText={setUnit} placeholder="Ex.: kg, L, un" maxLength={16} autoCapitalize="none" />
        <TextField
          label="Quantidade em estoque"
          value={quantity}
          onChangeText={setQuantity}
          error={errors.quantity}
          keyboardType="decimal-pad"
          suffix={suffix}
        />
        <TextField
          label="Avisar para repor quando for menor ou igual a (opcional)"
          value={threshold}
          onChangeText={setThreshold}
          error={errors.threshold}
          keyboardType="decimal-pad"
          suffix={suffix}
          hint="Deixe em branco para não receber alerta deste produto."
        />
      </View>

      <View className="gap-3">
        <Button title={isEdit ? 'Salvar alterações' : 'Adicionar produto'} onPress={handleSave} loading={save.isPending} />
        {isEdit ? <Button title="Apagar produto" variant="danger" onPress={confirmDelete} loading={remove.isPending} /> : null}
      </View>
    </Screen>
  );
}
