import React, { useCallback } from 'react';
import {
  ActivityIndicator,
    FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAccess } from '../access/AccessContext';
import { usePools, useProducts } from '../hooks/useWater';
import type { Pool } from '../api/types';
import type { AppStackParamList } from '../navigation/types';
import { palette } from '../theme/palette';
import { formatLiters } from '../utils/numbers';
import { getErrorMessage } from '../utils/apiError';
import { alert } from '../utils/dialog';

interface HomeScreenProps {
  navigation?: NativeStackNavigationProp<AppStackParamList>;
}

export function HomeScreen({ navigation: navProp }: HomeScreenProps = {}) {
  const defaultNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const navigation = navProp ?? defaultNavigation;

  const { lock } = useAccess();
  const { data: pools = [], isPending, error, refetch, isRefetching } = usePools();
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const lowCount = products.filter((product) => product.lowStock).length;

  // Recarrega a lista sempre que a tela voltar a ficar em foco
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchProducts();
    }, [refetch, refetchProducts])
  );

  const goToAddPool = () => navigation.navigate('PoolForm');

  const renderPool = ({ item }: { item: Pool }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir piscina ${item.name}`}
      onPress={() =>
        navigation.navigate('PoolDetail', { poolId: item.id, name: item.name })
      }
      className="flex-row items-center gap-3.5 p-4 rounded-[20px] border border-border bg-surface active:opacity-85"
    >
      <View className="w-12 h-12 rounded-[14px] items-center justify-center bg-water-soft">
        <Ionicons name="water-outline" size={24} color={palette.water} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[17px] font-semibold text-ink" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-[13px] text-ink-muted">
          {item.parameters && item.parameters.length > 0
            ? `${item.parameters.length} parâmetros monitorados`
            : 'Sem parâmetros cadastrados'}
        </Text>
        <Text className="text-sm font-semibold text-water mt-1">
          {item.volumeLiters !== null ? formatLiters(item.volumeLiters) : 'Volume não informado'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.inkMuted} />
    </Pressable>
  );

  const EmptyState = (
    <View className="items-center gap-3 p-7 rounded-3xl border border-border bg-surface">
      <View className="w-[88px] h-[88px] rounded-full items-center justify-center bg-water-soft">
        <Ionicons name="water-outline" size={44} color={palette.water} />
      </View>
      <Text className="text-[21px] font-bold text-ink text-center">
        Nenhuma piscina cadastrada
      </Text>
      <Text className="text-[15px] leading-[22px] text-ink-muted text-center">
        Adicione sua primeira piscina para começar a registrar medidas e parâmetros químicos.
      </Text>
    </View>
  );

  const firstLoad = isPending && pools.length === 0;

  function confirmChangeKey() {
    alert('Trocar código de acesso?', 'O app vai pedir o código de novo neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Trocar código', onPress: () => void lock() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-start gap-3 px-5 pt-3 pb-2">
        <View className="flex-1 gap-1.5">
          <Text className="text-[32px] leading-9 font-bold text-ink">
            Piscinas
          </Text>
          <Text className="text-base leading-[22px] text-ink-muted">
            healthPool Asseit · uso interno
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lowCount > 0 ? `Estoque de produtos, ${lowCount} para repor` : 'Estoque de produtos'}
          onPress={() => navigation.navigate('Products')}
          hitSlop={8}
          className="w-11 h-11 items-center justify-center rounded-full active:opacity-75"
        >
          <Ionicons name="flask-outline" size={22} color={lowCount > 0 ? palette.alert : palette.inkMuted} />
          {lowCount > 0 ? (
            <View className="absolute right-0 top-0 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-alert px-1">
              <Text className="text-[11px] font-bold text-on-accent">{lowCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trocar código de acesso"
          onPress={confirmChangeKey}
          hitSlop={8}
          className="w-11 h-11 items-center justify-center rounded-full active:opacity-75"
        >
          <Ionicons name="key-outline" size={22} color={palette.inkMuted} />
        </Pressable>
      </View>

      {error ? (
        <View className="mx-5 mt-2 p-3 gap-1.5 rounded-xl bg-alert-soft" accessibilityRole="alert">
          <Text className="text-sm text-alert">{getErrorMessage(error)}</Text>
          <Pressable onPress={() => void refetch()} accessibilityRole="button">
            <Text className="text-sm font-semibold text-alert">Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {lowCount > 0 ? (
        <Pressable
          onPress={() => navigation.navigate('Products')}
          accessibilityRole="alert"
          className="mx-5 mt-2 p-3 gap-0.5 rounded-xl bg-alert-soft active:opacity-85"
        >
          <Text className="text-sm font-semibold text-alert">
            {lowCount === 1 ? '1 produto precisa de reposição' : `${lowCount} produtos precisam de reposição`}
          </Text>
          <Text className="text-[13px] text-alert">Toque para ver o estoque</Text>
        </Pressable>
      ) : null}

      {firstLoad ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.water} />
        </View>
      ) : (
        <FlatList
          data={pools}
          keyExtractor={(item) => item.id}
          renderItem={renderPool}
          ListEmptyComponent={EmptyState}
          contentContainerClassName="grow px-5 py-4 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={palette.water}
            />
          }
        />
      )}

      <View className="px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar piscina"
          onPress={goToAddPool}
          className="h-14 flex-row items-center justify-center gap-2.5 rounded-2xl bg-water active:opacity-85"
        >
          <Ionicons name="add" size={24} color={palette.onAccent} />
          <Text className="text-[17px] font-semibold text-on-accent">
            Adicionar piscina
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default HomeScreen;
