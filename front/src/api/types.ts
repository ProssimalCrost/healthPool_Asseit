/**
 * Contrato com o back-end (healthPool Asseit).
 * Datas chegam como string ISO no JSON (não como Date), por isso o tipo IsoDate.
 */
export type IsoDate = string;

export interface Pagination {
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

/** Mesma regra do servidor: verde = IN_RANGE, vermelho = BELOW ou ABOVE, cinza = NO_REFERENCE. */
export type MeasurementStatus = 'IN_RANGE' | 'BELOW' | 'ABOVE' | 'NO_REFERENCE';

export interface Parameter {
  id: string;
  name: string;
  unit: string;
  min: number | null;
  max: number | null;
  /** Parâmetro padrão: não pode ser editado nem apagado pelo app. */
  isSystem: boolean;
  /** Vem marcado ao cadastrar uma piscina nova. */
  enabledByDefault: boolean;
}

export interface LatestReading {
  value: number;
  measuredAt: IsoDate;
  status: MeasurementStatus;
}

export interface TrackedParameter extends Parameter {
  latest: LatestReading | null;
}

export interface Pool {
  id: string;
  name: string;
  volumeLiters: number | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  parameters: TrackedParameter[];
}

export interface Measurement {
  id: string;
  poolId: string;
  parameterId: string;
  value: number;
  measuredAt: IsoDate;
  status: MeasurementStatus;
}

export interface MeasurementPage {
  items: Measurement[];
  pagination: Pagination;
}

export interface ReadingInput {
  parameterId: string;
  value: number;
}

export interface PoolInput {
  name: string;
  volumeLiters?: number | null;
  parameterIds?: string[];
}

export interface ParameterInput {
  name?: string;
  unit?: string;
  min?: number | null;
  max?: number | null;
}
