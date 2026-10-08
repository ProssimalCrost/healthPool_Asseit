import { Pressable, View } from 'react-native';
import type { Parameter } from '../api/types';
import { describeRange } from '../utils/status';
import { Text } from './Text';

interface ParameterChecklistProps {
  parameters: Parameter[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Só parâmetros criados pela equipe (não os padrão) podem ser editados. */
  onEdit: (id: string) => void;
}

export function ParameterChecklist({ parameters, selected, onToggle, onEdit }: ParameterChecklistProps) {
  return (
    <View className="gap-2">
      {parameters.map((parameter) => {
        const checked = selected.has(parameter.id);
        return (
          <View
            key={parameter.id}
            className={`flex-row items-center rounded-md border bg-surface ${checked ? 'border-water' : 'border-border'}`}
          >
            <Pressable
              onPress={() => onToggle(parameter.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={`${parameter.name}. ${describeRange(parameter)}`}
              className="min-h-14 flex-1 flex-row items-center gap-3 px-3.5 py-2.5"
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded border-2 ${
                  checked ? 'border-water bg-water' : 'border-border bg-surface'
                }`}
              >
                {checked ? (
                  <Text variant="label" tone="onAccent" importantForAccessibility="no">
                    ✓
                  </Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text variant="label">{parameter.name}</Text>
                <Text variant="small">{describeRange(parameter)}</Text>
              </View>
            </Pressable>
            {!parameter.isSystem ? (
              <Pressable
                onPress={() => onEdit(parameter.id)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${parameter.name}`}
                className="min-h-14 justify-center px-3.5"
              >
                <Text variant="label" tone="accent">
                  Editar
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
