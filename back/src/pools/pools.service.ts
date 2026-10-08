import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePoolDto } from './dto/create-pool.dto.js';
import type { UpdatePoolDto } from './dto/update-pool.dto.js';
import { latestKey, toPoolDto, type LatestValue, type PoolDto } from './pool.dto.js';

const POOL_INCLUDE = { parameters: { include: { parameter: true } } } as const;

@Injectable()
export class PoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PoolDto[]> {
    const pools = await this.prisma.pool.findMany({ orderBy: { name: 'asc' }, include: POOL_INCLUDE });
    const latest = await this.latestReadings(pools.map((pool) => pool.id));
    return pools.map((pool) => toPoolDto(pool, latest));
  }

  async get(id: string): Promise<PoolDto> {
    const pool = await this.prisma.pool.findUnique({ where: { id }, include: POOL_INCLUDE });
    if (!pool) throw new NotFoundException('Piscina não encontrada.');
    return toPoolDto(pool, await this.latestReadings([pool.id]));
  }

  async create(dto: CreatePoolDto): Promise<PoolDto> {
    const parameterIds = dto.parameterIds ?? (await this.defaultParameterIds());
    await this.assertParametersExist(parameterIds);

    const pool = await this.prisma.pool.create({
      data: {
        name: dto.name,
        volumeLiters: dto.volumeLiters ?? null,
        parameters: { create: parameterIds.map((parameterId) => ({ parameterId })) },
      },
      include: POOL_INCLUDE,
    });
    return toPoolDto(pool, new Map());
  }

  async update(id: string, dto: UpdatePoolDto): Promise<PoolDto> {
    await this.findOrThrow(id);
    if (dto.parameterIds) await this.assertParametersExist(dto.parameterIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.pool.update({ where: { id }, data: { name: dto.name, volumeLiters: dto.volumeLiters } });
      if (dto.parameterIds) {
        // Substitui a lista. As medições antigas dos parâmetros removidos continuam no histórico.
        await tx.poolParameter.deleteMany({ where: { poolId: id, parameterId: { notIn: dto.parameterIds } } });
        await tx.poolParameter.createMany({
          data: dto.parameterIds.map((parameterId) => ({ poolId: id, parameterId })),
          skipDuplicates: true,
        });
      }
    });
    return this.get(id);
  }

  /** Apaga a piscina e, em cascata, as medições dela. */
  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.pool.delete({ where: { id } });
  }

  private async findOrThrow(id: string) {
    const pool = await this.prisma.pool.findUnique({ where: { id }, select: { id: true } });
    if (!pool) throw new NotFoundException('Piscina não encontrada.');
    return pool;
  }

  private async defaultParameterIds(): Promise<string[]> {
    const rows = await this.prisma.parameterDefinition.findMany({
      where: { enabledByDefault: true },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  private async assertParametersExist(parameterIds: string[]) {
    if (parameterIds.length === 0) return;
    const found = await this.prisma.parameterDefinition.count({ where: { id: { in: parameterIds } } });
    if (found !== new Set(parameterIds).size) {
      throw new BadRequestException('Um ou mais parâmetros são inválidos.');
    }
  }

  /** Última medição de cada (piscina, parâmetro), pela data da medição e não pela de cadastro. */
  private async latestReadings(poolIds: string[]): Promise<Map<string, LatestValue>> {
    const latest = new Map<string, LatestValue>();
    if (poolIds.length === 0) return latest;

    const rows = await this.prisma.measurement.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
      distinct: ['poolId', 'parameterId'],
      select: { poolId: true, parameterId: true, value: true, measuredAt: true },
    });
    for (const row of rows) {
      latest.set(latestKey(row.poolId, row.parameterId), { value: row.value, measuredAt: row.measuredAt });
    }
    return latest;
  }
}
