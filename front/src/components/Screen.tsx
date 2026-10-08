import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme/palette';

interface ScreenProps {
  children: ReactNode;
  /** Telas sem cabeçalho de navegação (login, cadastro) precisam da margem segura do topo. */
  withTopInset?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ children, withTopInset = false, refreshing, onRefresh }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: withTopInset ? insets.top : 0, paddingLeft: insets.left, paddingRight: insets.right }}
    >
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="grow gap-5 p-5 pb-12"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={palette.water} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
