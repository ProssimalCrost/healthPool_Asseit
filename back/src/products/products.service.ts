import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { ListProductUsagesQuery } from './dto/list-product-usages.query.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import { toProductDto, toProductUsageDto, type ProductDto, type ProductUsagePage } from './product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ProductDto[]> {
    const rows = await this.prisma.product.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toProductDto);
  }

  async create(dto: CreateProductDto): Promise<ProductDto> {
    try {
      const row = await this.prisma.product.create({
        data: {
          name: dto.name,
          unit: dto.unit ?? 'un',
          quantity: dto.quantity,
          alertThreshold: dto.alertThreshold ?? null,
        },
      });
      return toProductDto(row);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    await this.findOrThrow(id);
    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: { name: dto.name, unit: dto.unit, quantity: dto.quantity, alertThreshold: dto.alertThreshold },
      });
      return toProductDto(row);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  /** Apaga do estoque. O histórico de uso continua, com o nome guardado. */
  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.product.delete({ where: { id } });
  }

  async listUsages(query: ListProductUsagesQuery): Promise<ProductUsagePage> {
    const pool = await this.prisma.pool.findUnique({ where: { id: query.poolId }, select: { id: true } });
    if (!pool) throw new NotFoundException('Piscina não encontrada.');

    const where = { poolId: pool.id };
    const [rows, total] = await Promise.all([
      this.prisma.productUsage.findMany({
        where,
        orderBy: [{ usedAt: 'desc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.productUsage.count({ where }),
    ]);
    return {
      items: rows.map(toProductUsageDto),
      pagination: { total, skip: query.skip, take: query.take, hasMore: query.skip + query.take < total },
    };
  }

  private async findOrThrow(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Produto não encontrado.');
    return row;
  }

  private translateUniqueViolation(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('Já existe um produto com este nome.');
    }
    return error;
  }
}
