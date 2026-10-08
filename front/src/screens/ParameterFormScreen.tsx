import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createParameter, deleteParameter, updateParameter } from '../api/parameters';
import { queryKeys } from '../api/queryKeys';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { useParameters } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { alert } from '../utils/dialog';
import { formatNumber, parseDecimal } from '../utils/numbers';

type Props = NativeStackScreenProps<AppStackParamList, 'ParameterForm'>;

interface FieldErrors {
  name?: string;
  min?: string;
  max?: string;
}

export function ParameterFormScreen({ navigation, route }: Props) {
  const parameterId = route.params?.parameterId;
  const isEdit = parameterId !== undefined;
  const queryClient = useQueryClient();
  const parametersQuery = useParameters();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const initialized = useRef(false);

  const existing = parametersQuery.data?.find((p) => p.id === parameterId);

  useEffect(() => {
    if (initialized.current || !existing) return;
    initialized.current = true;
    setName(existing.name);
    setUnit(existing.unit);
    setMin(existing.min !== null ? formatNumber(existing.min) : '');
    setMax(existing.max !== null ? formatNumber(existing.max) : '');
  }, [existing]);

  const refreshEverything = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.parameters }),
      // nomes e faixas aparecem nas piscinas, e as cores das medições dependem da faixa
      queryClient.invalidateQueries({ queryKey: queryKeys.pools }),
      queryClient.invalidateQueries({ queryKey: queryKeys.measurements }),
    ]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        unit: unit.trim(),
        min: parseDecimal(min),
        max: parseDecimal(max),
      };
      return isEdit ? updateParameter(parameterId, body) : createParameter(body);
    },
    onSuccess: async () => {
      await refreshEverything();
      navigation.goBack();
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteParameter(parameterId as string),
    onSuccess: async () => {
      await refreshEverything();
      navigation.goBack();
    },
    onError: (error) => alert('Parâmetro não apagado', getErrorMessage(error)),
  });

  if (parametersQuery.isPending) return <Loading label="Carregando" />;
  if (parametersQuery.error || !parametersQuery.data) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(parametersQuery.error)} onRetry={() => void parametersQuery.refetch()} />
      </Screen>
    );
  }
  if (isEdit && (!existing || existing.isSystem)) {
    return (
      <Screen>
        <ErrorBanner
          message={
            existing?.isSystem
              ? 'Parâmetros padrão não podem ser alterados. Crie um parâmetro novo.'
              : 'Não encontramos este parâmetro.'
          }
        />
      </Screen>
    );
  }

  function handleSave() {
    const minValue = parseDecimal(min);
    const maxValue = parseDecimal(max);
    const next: FieldErrors = {};
    if (name.trim() === '') next.name = 'Dê um nome para o parâmetro.';
    if (minValue !== null && Number.isNaN(minValue)) next.min = 'Digite só números, como 7,2.';
    if (maxValue !== null && Number.isNaN(maxValue)) next.max = 'Digite só números, como 7,8.';
    if (!next.min && !next.max && minValue !== null && maxValue !== null && minValue > maxValue) {
      next.max = 'O máximo precisa ser maior ou igual ao mínimo.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    save.mutate();
  }

  function confirmDelete() {
    alert(
      `Apagar ${existing?.name ?? 'parâmetro'}?`,
      'Todas as medições deste parâmetro também serão apagadas. Isso não pode ser desfeito.',
      [
        { text: 'Manter parâmetro', style: 'cancel' },
        { text: 'Apagar parâmetro', style: 'destructive', onPress: () => remove.mutate() },
      ],
    );
  }

  return (
    <Screen>
      <Text tone="muted">
        Use para medir algo além dos parâmetros padrão, como sal ou turbidez. As medições ficam verdes dentro da faixa
        que você definir e vermelhas fora dela.
      </Text>

      {save.error ? (
        <ErrorBanner message={getErrorMessage(save.error, { 409: 'Já existe um parâmetro com este nome.' })} />
      ) : null}

      <View className="gap-4">
        <TextField label="Nome" value={name} onChangeText={setName} error={errors.name} placeholder="Ex.: Sal" maxLength={40} />
        <TextField label="Unidade (opcional)" value={unit} onChangeText={setUnit} placeholder="Ex.: g/L" maxLength={16} autoCapitalize="none" />
        <TextField
          label="Mínimo ideal (opcional)"
          value={min}
          onChangeText={setMin}
          error={errors.min}
          keyboardType="decimal-pad"
          suffix={unit.trim() || undefined}
        />
        <TextField
          label="Máximo ideal (opcional)"
          value={max}
          onChangeText={setMax}
          error={errors.max}
          keyboardType="decimal-pad"
          suffix={unit.trim() || undefined}
          hint="Deixe em branco o limite que não importa. Sem nenhum limite, as medições ficam em cinza."
        />
      </View>

      <View className="gap-3">
        <Button title={isEdit ? 'Salvar alterações' : 'Criar parâmetro'} onPress={handleSave} loading={save.isPending} />
        {isEdit ? <Button title="Apagar parâmetro" variant="danger" onPress={confirmDelete} loading={remove.isPending} /> : null}
      </View>
    </Screen>
  );
}
