import { api } from './client';
import type { Measurement, MeasurementPage, ProductUseInput, ReadingInput } from './types';

export async function createMeasurements(
  poolId: string,
  readings: ReadingInput[],
  products: ProductUseInput[] = [],
): Promise<Measurement[]> {
  // Sem measuredAt: o servidor usa o momento do envio, e os produtos ficam com a mesma data.
  const { data } = await api.post<Measurement[]>('/measurements', { poolId, readings, products });
  return data;
}

export interface MeasurementQuery {
  poolId: string;
  parameterId?: string;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

export async function listMeasurements(query: MeasurementQuery): Promise<MeasurementPage> {
  const { data } = await api.get<MeasurementPage>('/measurements', { params: query });
  return data;
}

export async function deleteMeasurement(id: string): Promise<void> {
  await api.delete(`/measurements/${encodeURIComponent(id)}`);
}
