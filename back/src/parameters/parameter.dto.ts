/** Parâmetro como o app recebe. */
export interface ParameterDto {
  id: string;
  name: string;
  unit: string;
  min: number | null;
  max: number | null;
  /** true = parâmetro padrão (criado pelo servidor, não editável pelo app). */
  isSystem: boolean;
  /** Vem marcado ao cadastrar uma piscina nova. */
  enabledByDefault: boolean;
}

interface ParameterRow {
  id: string;
  systemKey: string | null;
  name: string;
  unit: string;
  minValue: number | null;
  maxValue: number | null;
  enabledByDefault: boolean;
}

export function toParameterDto(row: ParameterRow): ParameterDto {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    min: row.minValue,
    max: row.maxValue,
    isSystem: row.systemKey !== null,
    enabledByDefault: row.enabledByDefault,
  };
}
