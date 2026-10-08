import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMeasurementDto } from './dto/create-measurement.dto.js';
import type { ListMeasurementsQuery } from './dto/list-measurements.query.js';
import { toMeasurementDto, type MeasurementDto, type MeasurementPage } from './measurement.dto.js';

/** Tolerância para o relógio do celular estar um pouco adiantado. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMeasurementDto): Promise<MeasurementDto[]> {
    const pool = await this.prisma.pool.findUnique({
      where: { id: dto.poolId },
      select: { id: true, parameters: { select: { parameterId: true } } },
    });
    if (!pool) throw new NotFoundException('Piscina não encontrada.');

    const measuredAt = dto.measuredAt ? new Date(dto.measuredAt) : new Date();
    if (measuredAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
      throw new BadRequestException('A data da medição não pode estar no futuro.');
    }

    const parameterIds = dto.readings.map((reading) => reading.parameterId);
    if (new Set(parameterIds).size !== parameterIds.length) {
      throw new BadRequestException('Cada parâmetro só pode aparecer uma vez por medição.');
    }
    const tracked = new Set(pool.parameters.map((p) => p.parameterId));
    if (parameterIds.some((id) => !tracked.has(id))) {
      throw new BadRequestException('Um ou mais parâmetros não são acompanhados nesta piscina.');
    }

    const definitions = await this.prisma.parameterDefinition.findMany({
      where: { id: { in: parameterIds } },
      select: { id: true, minValue: true, maxValue: true },
    });
    const rangeById = new Map(definitions.map((d) => [d.id, d]));

    const created = await this.prisma.measurement.createManyAndReturn({
      data: dto.readings.map((reading) => ({
        poolId: pool.id,
        parameterId: reading.parameterId,
        value: reading.value,
        measuredAt,
      })),
    });

    return created.map((row) =>
      toMeasurementDto(row, rangeById.get(row.parameterId) ?? { minValue: null, maxValue: null }),
    );
  }

  async list(query: ListMeasurementsQuery): Promise<MeasurementPage> {
    const pool = await this.prisma.pool.findUnique({ where: { id: query.poolId }, select: { id: true } });
    if (!pool) throw new NotFoundException('Piscina não encontrada.');

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from > to) {
      throw new BadRequestException('A data inicial não pode ser depois da final.');
    }

    const where = {
      poolId: pool.id,
      ...(query.parameterId ? { parameterId: query.parameterId } : {}),
      ...(from || to ? { measuredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.measurement.findMany({
        where,
        orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.take,
        include: { parameter: { select: { minValue: true, maxValue: true } } },
      }),
      this.prisma.measurement.count({ where }),
    ]);

    return {
      items: rows.map((row) => toMeasurementDto(row, row.parameter)),
      pagination: { total, skip: query.skip, take: query.take, hasMore: query.skip + query.take < total },
    };
  }

  async remove(id: string): Promise<void> {
    const found = await this.prisma.measurement.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Medição não encontrada.');
    await this.prisma.measurement.delete({ where: { id } });
  }
}
