import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Igual ao Alert.alert, mas também funciona no navegador.
 * No react-native-web o Alert.alert não faz nada, então confirmações como
 * "Excluir piscina?" sumiriam na versão web. Lá usamos window.confirm / window.alert.
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find((button) => button.style !== 'cancel');
  if (!action) {
    globalThis.alert?.(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  if (globalThis.confirm?.(text)) action.onPress?.();
  else buttons?.find((button) => button.style === 'cancel')?.onPress?.();
}
