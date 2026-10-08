/**
 * Parâmetros padrão e faixas de referência.
 *
 * ATENÇÃO: as fontes públicas divergem. Por exemplo, a dureza cálcica aparece como
 * 150-300, 200-275 ou 200-400 mg/L conforme a fonte, e o cloro livre mínimo aparece
 * como 0,8 ou 1,0 mg/L. Estes valores são um ponto de partida e PRECISAM ser revisados
 * por um profissional (químico ou engenheiro) e conferidos com a norma ABNT vigente
 * antes de ir para as lojas.
 *
 * Os valores são criados uma única vez e depois ficam no banco: ajustá-los na tabela
 * parameter_definitions não exige novo lançamento do app, e o servidor nunca os
 * sobrescreve no boot.
 */
export interface SystemParameterSeed {
  systemKey: string;
  name: string;
  unit: string;
  min: number | null;
  max: number | null;
  enabledByDefault: boolean;
  sortOrder: number;
}

export const SYSTEM_PARAMETERS: readonly SystemParameterSeed[] = [
  { systemKey: 'ph', name: 'pH', unit: '', min: 7.2, max: 7.8, enabledByDefault: true, sortOrder: 10 },
  { systemKey: 'free_chlorine', name: 'Cloro livre', unit: 'mg/L', min: 1.0, max: 3.0, enabledByDefault: true, sortOrder: 20 },
  { systemKey: 'total_alkalinity', name: 'Alcalinidade total', unit: 'mg/L', min: 80, max: 120, enabledByDefault: true, sortOrder: 30 },
  { systemKey: 'calcium_hardness', name: 'Dureza cálcica', unit: 'mg/L', min: 150, max: 300, enabledByDefault: false, sortOrder: 40 },
  { systemKey: 'cyanuric_acid', name: 'Ácido cianúrico', unit: 'mg/L', min: 30, max: 50, enabledByDefault: false, sortOrder: 50 },
];
