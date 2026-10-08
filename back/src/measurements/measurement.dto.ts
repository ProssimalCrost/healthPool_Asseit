import { evaluateStatus, type MeasurementStatus } from './measurement-status.js';

export interface MeasurementDto {
  id: string;
  poolId: string;
  parameterId: string;
  value: number;
  measuredAt: Date;
  status: MeasurementStatus;
}

export interface MeasurementPage {
  items: MeasurementDto[];
  pagination: { total: number; skip: number; take: number; hasMore: boolean };
}

interface MeasurementRow {
  id: string;
  poolId: string;
  parameterId: string;
  value: number;
  measuredAt: Date;
}

export function toMeasurementDto(
  row: MeasurementRow,
  range: { minValue: number | null; maxValue: number | null },
): MeasurementDto {
  return {
    id: row.id,
    poolId: row.poolId,
    parameterId: row.parameterId,
    value: row.value,
    measuredAt: row.measuredAt,
    status: evaluateStatus(row.value, range.minValue, range.maxValue),
  };
}
