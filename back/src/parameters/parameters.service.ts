import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateParameterDto } from './dto/create-parameter.dto.js';
import type { UpdateParameterDto } from './dto/update-parameter.dto.js';
import { toParameterDto, type ParameterDto } from './parameter.dto.js';

/** Parâmetros criados pela equipe vêm depois dos padrão na ordem de exibição. */
const CUSTOM_SORT_ORDER = 1000;

@Injectable()
export class ParametersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ParameterDto[]> {
    const rows = await this.prisma.parameterDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toParameterDto);
  }

  async create(dto: CreateParameterDto): Promise<ParameterDto> {
    const min = dto.min ?? null;
    const max = dto.max ?? null;
    this.assertRange(min, max);
    await this.assertNameFree(dto.name);

    try {
      const row = await this.prisma.parameterDefinition.create({
        data: { name: dto.name, unit: dto.unit ?? '', minValue: min, maxValue: max, sortOrder: CUSTOM_SORT_ORDER },
      });
      return toParameterDto(row);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async update(id: string, dto: UpdateParameterDto): Promise<ParameterDto> {
    const current = await this.findEditableOrThrow(id);

    // Valida a faixa que vai ficar, misturando o que veio com o que já existe.
    const min = dto.min === undefined ? current.minValue : dto.min;
    const max = dto.max === undefined ? current.maxValue : dto.max;
    this.assertRange(min, max);

    if (dto.name !== undefined && dto.name.toLowerCase() !== current.name.toLowerCase()) {
      await this.assertNameFree(dto.name, id);
    }

    try {
      const row = await this.prisma.parameterDefinition.update({
        where: { id },
        data: { name: dto.name, unit: dto.unit, minValue: min, maxValue: max },
      });
      return toParameterDto(row);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  /** Apagar um parâmetro apaga também as medições dele (cascata no banco). */
  async remove(id: string): Promise<void> {
    await this.findEditableOrThrow(id);
    await this.prisma.parameterDefinition.delete({ where: { id } });
  }

  /** 404 se não existe; 403 se é parâmetro padrão. */
  private async findEditableOrThrow(id: string) {
    const row = await this.prisma.parameterDefinition.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Parâmetro não encontrado.');
    if (row.systemKey !== null) {
      throw new ForbiddenException('Parâmetros padrão não podem ser alterados. Crie um parâmetro novo.');
    }
    return row;
  }

  private assertRange(min: number | null, max: number | null) {
    if (min !== null && max !== null && min > max) {
      throw new BadRequestException('O mínimo não pode ser maior que o máximo.');
    }
  }

  /** Nome único, sem diferenciar maiúsculas ("pH" e "PH" são o mesmo). */
  private async assertNameFree(name: string, exceptId?: string) {
    const clash = await this.prisma.parameterDefinition.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (clash) throw new ConflictException('Já existe um parâmetro com este nome.');
  }

  /** Duas requisições simultâneas podem passar pela checagem; o índice único do banco segura a segunda. */
  private translateUniqueViolation(error: unknown): unknown {
    const code = (error as { code?: string } | null)?.code;
    return code === 'P2002' ? new ConflictException('Já existe um parâmetro com este nome.') : error;
  }
}
