import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import type { Product } from '../api/types';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Loading } from '../components/Loading';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { useProducts } from '../hooks/useWater';
import type { AppStackParamList } from '../navigation/types';
import { getErrorMessage } from '../utils/apiError';
import { formatValue } from '../utils/numbers';

type Props = NativeStackScreenProps<AppStackParamList, 'Products'>;

export function ProductsScreen({ navigation }: Props) {
  const { data: products, isPending, error, refetch, isRefetching } = useProducts();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  if (isPending) return <Loading label="Carregando o estoque" />;
  if (error || !products) {
    return (
      <Screen>
        <ErrorBanner message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const low = products.filter((product) => product.lowStock);

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      {low.length > 0 ? (
        <View className="gap-1 rounded-md bg-alert-soft p-3.5" accessibilityRole="alert">
          <Text variant="label" tone="alert">
            {low.length === 1 ? '1 produto precisa de reposição' : `${low.length} produtos precisam de reposição`}
          </Text>
          <Text variant="small" tone="alert">
            {low.map((product) => product.name).join(', ')}
          </Text>
        </View>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto no estoque"
          message="Cadastre os produtos que você usa nas piscinas e a quantidade que tem. Defina um alerta para ser avisado na hora de repor."
        />
      ) : (
        <View className="gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
            />
          ))}
        </View>
      )}

      <Button title="Adicionar produto" onPress={() => navigation.navigate('ProductForm')} />
    </Screen>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Abre a edição deste produto"
      className={`gap-2 rounded-lg border bg-surface p-4 active:bg-water-soft ${
        product.lowStock ? 'border-alert' : 'border-border'
      }`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="heading">{product.name}</Text>
          <Text variant="small">
            {product.alertThreshold !== null
              ? `Avisar quando chegar a ${formatValue(product.alertThreshold, product.unit)} ou menos`
              : 'Sem alerta'}
          </Text>
        </View>
        <Text variant="title" tone={product.lowStock ? 'alert' : 'default'}>
          {formatValue(product.quantity, product.unit)}
        </Text>
      </View>
      {product.lowStock ? (
        <Text variant="label" tone="alert">
          Repor estoque
        </Text>
      ) : null}
    </Pressable>
  );
}
