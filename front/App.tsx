import './global.css';

import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessProvider } from './src/access/AccessContext';
import { queryClient } from './src/api/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette } from './src/theme/palette';

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.water,
    background: palette.background,
    card: palette.surface,
    text: palette.ink,
    border: palette.border,
    notification: palette.alert,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AccessProvider>
          <NavigationContainer theme={navigationTheme} documentTitle={{ formatter: () => 'healthPool Asseit' }}>
            <RootNavigator />
          </NavigationContainer>
        </AccessProvider>
      </QueryClientProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
