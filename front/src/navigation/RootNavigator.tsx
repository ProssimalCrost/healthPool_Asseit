import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAccess } from '../access/AccessContext';
import { HeaderButton } from '../components/HeaderButton';
import { Loading } from '../components/Loading';
import { AccessKeyScreen } from '../screens/AccessKeyScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MeasurementFormScreen } from '../screens/MeasurementFormScreen';
import { ParameterFormScreen } from '../screens/ParameterFormScreen';
import { PoolDetailScreen } from '../screens/PoolDetailScreen';
import { PoolFormScreen } from '../screens/PoolFormScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { palette } from '../theme/palette';
import type { AppStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();

// Opções do React Navigation não aceitam className: usam as cores em hexadecimal.
const headerOptions = {
  headerStyle: { backgroundColor: palette.background },
  headerTintColor: palette.ink,
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '700' as const },
};

export function RootNavigator() {
  const { state } = useAccess();

  if (state.status === 'loading') return <Loading label="Abrindo o app" />;
  if (state.status === 'locked') return <AccessKeyScreen />;

  return (
    <AppStack.Navigator screenOptions={headerOptions}>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <AppStack.Screen
        name="PoolDetail"
        component={PoolDetailScreen}
        options={({ route, navigation }) => ({
          title: route.params.name,
          headerRight: () => (
            <HeaderButton title="Editar" onPress={() => navigation.navigate('PoolForm', { poolId: route.params.poolId })} />
          ),
        })}
      />
      <AppStack.Screen
        name="PoolForm"
        component={PoolFormScreen}
        options={({ route }) => ({ title: route.params?.poolId ? 'Editar piscina' : 'Nova piscina' })}
      />
      <AppStack.Screen name="MeasurementForm" component={MeasurementFormScreen} options={{ title: 'Registrar medição' }} />
      <AppStack.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <AppStack.Screen name="Products" component={ProductsScreen} options={{ title: 'Estoque de produtos' }} />
      <AppStack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({ title: route.params?.productId ? 'Editar produto' : 'Novo produto' })}
      />
      <AppStack.Screen
        name="ParameterForm"
        component={ParameterFormScreen}
        options={({ route }) => ({ title: route.params?.parameterId ? 'Editar parâmetro' : 'Novo parâmetro' })}
      />
    </AppStack.Navigator>
  );
}
