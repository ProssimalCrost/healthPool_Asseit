import { Controller, Get } from '@nestjs/common';
import { Public } from '../access/access-key.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Usado pela nuvem (health check) e pelo app para testar a conexão. Não exige código. */
  @Public()
  @Get()
  async check(): Promise<{ status: 'ok'; database: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'ok' };
  }

  /** Confere o código de acesso sem tocar em dados. O app usa ao salvar o código. */
  @Get('access')
  access(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
