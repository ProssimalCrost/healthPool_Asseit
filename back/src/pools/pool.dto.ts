import type { MeasurementStatus } from '../measurements/measurement-status.js';
import { evaluateStatus } from '../measurements/measurement-status.js';
import { toParameterDto, type ParameterDto } from '../parameters/parameter.dto.js';

export interface LatestReadingDto {
  value: number;
  measuredAt: Date;
  status: MeasurementStatus;
}

/** Parâmetro acompanhado pela piscina, com a última medição dele (ou null se nunca medido). */
export interface TrackedParameterDto extends ParameterDto {
  latest: LatestReadingDto | null;
}

export interface PoolDto {
  id: string;
  name: string;
  volumeLiters: number | null;
  createdAt: Date;
  updatedAt: Date;
  parameters: TrackedParameterDto[];
}

interface PoolRow {
  id: string;
  name: string;
  volumeLiters: number | null;
  createdAt: Date;
  updatedAt: Date;
  parameters: {
    parameter: {
      id: string;
      systemKey: string | null;
      name: string;
      unit: string;
      minValue: number | null;
      maxValue: number | null;
      enabledByDefault: boolean;
      sortOrder: number;
    };
  }[];
}

export interface LatestValue {
  value: number;
  measuredAt: Date;
}

export const latestKey = (poolId: string, parameterId: string) => `${poolId}:${parameterId}`;

export function toPoolDto(pool: PoolRow, latest: Map<string, LatestValue>): PoolDto {
  const parameters = pool.parameters
    .map(({ parameter }) => parameter)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((parameter): TrackedParameterDto => {
      const last = latest.get(latestKey(pool.id, parameter.id));
      return {
        ...toParameterDto(parameter),
        latest: last
          ? {
              value: last.value,
              measuredAt: last.measuredAt,
              status: evaluateStatus(last.value, parameter.minValue, parameter.maxValue),
            }
          : null,
      };
    });

  return {
    id: pool.id,
    name: pool.name,
    volumeLiters: pool.volumeLiters,
    createdAt: pool.createdAt,
    updatedAt: pool.updatedAt,
    parameters,
  };
}
