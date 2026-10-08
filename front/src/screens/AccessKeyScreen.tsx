import { useState } from 'react';
import { View } from 'react-native';
import { useAccess } from '../access/AccessContext';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { getErrorMessage } from '../utils/apiError';

/** Única tela antes do app: pede o código de acesso da equipe (não é login, não há conta). */
export function AccessKeyScreen() {
  const { state, unlock } = useAccess();
  const [key, setKey] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const wasRevoked = state.status === 'locked' && state.reason === 'invalid';

  async function handleSubmit() {
    if (key.trim() === '') {
      setFieldError('Digite o código de acesso.');
      return;
    }
    setFieldError(undefined);
    setFormError(null);
    setSubmitting(true);
    try {
      await unlock(key);
      // A troca de tela acontece sozinha: o RootNavigator passa para o app.
    } catch (error) {
      setFormError(getErrorMessage(error, { 401: 'Código incorreto. Confira com o responsável e tente de novo.' }));
      setSubmitting(false);
    }
  }

  return (
    <Screen withTopInset>
      <View className="mb-2 mt-10 gap-2">
        <Text variant="display">healthPool Asseit</Text>
        <Text tone="muted">Uso interno. Digite o código de acesso da equipe. Ele fica salvo neste aparelho.</Text>
      </View>

      {wasRevoked && !formError ? (
        <ErrorBanner message="O código de acesso mudou. Digite o código novo." />
      ) : null}
      {formError ? <ErrorBanner message={formError} /> : null}

      <View className="gap-4">
        <TextField
          label="Código de acesso"
          value={key}
          onChangeText={setKey}
          error={fieldError}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button title="Entrar" onPress={() => void handleSubmit()} loading={submitting} />
      </View>
    </Screen>
  );
}
