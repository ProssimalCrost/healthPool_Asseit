import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createPool, deletePool, updatePool } from '../api/pools';
import { queryKeys } from '../api/queryKeys';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { ParameterChecklist } from '../components/ParameterChecklist';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { useParameters, usePool } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { alert } from '../utils/dialog';
import { parseLiters } from '../utils/numbers';

type Props = NativeStackScreenProps<AppStackParamList, 'PoolForm'>;

export function PoolFormScreen({ navigation, route }: Props) {
  const poolId = route.params?.poolId;
  const isEdit = poolId !== undefined;
  const queryClient = useQueryClient();
  const poolQuery = usePool(poolId);
  const parametersQuery = useParameters();

  const [name, setName] = useState('');
  const [volume, setVolume] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [nameError, setNameError] = useState<string>();
  const [volumeError, setVolumeError] = useState<string>();

  // IDs de parâmetros já vistos: o que aparecer depois (criado na tela de parâmetro) vem marcado.
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const parameters = parametersQuery.data;
    if (!parameters) return;

    if (knownIds.current === null) {
      if (isEdit && !poolQuery.data) return; // espera os dados da piscina
      knownIds.current = new Set(parameters.map((p) => p.id));
      if (isEdit && poolQuery.data) {
        setName(poolQuery.data.name);
        setVolume(poolQuery.data.volumeLiters !== null ? String(poolQuery.data.volumeLiters) : '');
        setSelected(new Set(poolQuery.data.parameters.map((p) => p.id)));
      } else {
        setSelected(new Set(parameters.filter((p) => p.enabledByDefault).map((p) => p.id)));
      }
      return;
    }

    const fresh = parameters.filter((p) => !knownIds.current?.has(p.id));
    if (fresh.length > 0) {
      fresh.forEach((p) => knownIds.current?.add(p.id));
      setSelected((previous) => new Set([...previous, ...fresh.filter((p) => !p.isSystem).map((p) => p.id)]));
    }
  }, [parametersQuery.data, poolQuery.data, isEdit]);

  const save = useMutation({
    mutationFn: async () => {
      const liters = parseLiters(volume);
      // Só envia parâmetros que ainda existem (um próprio pode ter sido apagado nesse meio tempo).
      const parameterIds = (parametersQuery.data ?? []).filter((p) => selected.has(p.id)).map((p) => p.id);
      if (isEdit) {
        return updatePool(poolId, { name: name.trim(), volumeLiters: liters, parameterIds });
      }
      return createPool({ name: name.trim(), volumeLiters: liters ?? undefined, parameterIds });
    },
    onSuccess: async (pool) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pools });
      if (isEdit) navigation.goBack();
      else navigation.replace('PoolDetail', { poolId: pool.id, name: pool.name });
    },
  });

  const remove = useMutation({
    mutationFn: () => deletePool(poolId as string),
    onSuccess: async () => {
      navigation.popToTop();
      queryClient.removeQueries({ queryKey: queryKeys.pool(poolId as string) });
      queryClient.removeQueries({ queryKey: queryKeys.measurements });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pools });
    },
    onError: (error) => alert('Piscina não excluída', getErrorMessage(error)),
  });

  if (parametersQuery.isPending || (isEdit && poolQuery.isPending)) return <Loading label="Carregando" />;
  if (parametersQuery.error || !parametersQuery.data || (isEdit && !poolQuery.data)) {
    return (
      <Screen>
        <ErrorBanner
          message={getErrorMessage(parametersQuery.error ?? poolQuery.error)}
          onRetry={() => {
            void parametersQuery.refetch();
            void poolQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  function handleSave() {
    const liters = parseLiters(volume);
    const nextNameError = name.trim() === '' ? 'Dê um nome para a piscina.' : undefined;
    const nextVolumeError =
      liters !== null && Number.isNaN(liters) ? 'Digite o volume em litros, só números.' : undefined;
    setNameError(nextNameError);
    setVolumeError(nextVolumeError);
    if (nextNameError || nextVolumeError) return;
    save.mutate();
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    alert(
      'Excluir piscina?',
      'As medições desta piscina também serão apagadas. Isso não pode ser desfeito.',
      [
        { text: 'Manter piscina', style: 'cancel' },
        { text: 'Excluir piscina', style: 'destructive', onPress: () => remove.mutate() },
      ],
    );
  }

  return (
    <Screen>
      {save.error ? <ErrorBanner message={getErrorMessage(save.error)} /> : null}

      <View className="gap-4">
        <TextField
          label="Nome da piscina"
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder="Ex.: Piscina do quintal"
          maxLength={60}
        />
        <TextField
          label="Volume (opcional)"
          value={volume}
          onChangeText={setVolume}
          error={volumeError}
          keyboardType="number-pad"
          suffix="litros"
          hint="Ajuda a calcular quanto produto usar."
        />
      </View>

      <View className="gap-3">
        <View className="gap-1">
          <Text variant="heading">O que você mede</Text>
          <Text variant="small">Marque os parâmetros desta piscina. A faixa ideal aparece ao lado de cada um.</Text>
        </View>
        <ParameterChecklist
          parameters={parametersQuery.data}
          selected={selected}
          onToggle={toggle}
          onEdit={(parameterId) => navigation.navigate('ParameterForm', { parameterId })}
        />
        <Button title="Criar parâmetro" variant="secondary" onPress={() => navigation.navigate('ParameterForm')} />
      </View>

      <View className="gap-3">
        <Button title={isEdit ? 'Salvar alterações' : 'Cadastrar piscina'} onPress={handleSave} loading={save.isPending} />
        {isEdit ? (
          <Button title="Excluir piscina" variant="danger" onPress={confirmDelete} loading={remove.isPending} />
        ) : null}
      </View>
    </Screen>
  );
}
