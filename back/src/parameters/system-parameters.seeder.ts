import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SYSTEM_PARAMETERS } from './system-parameters.js';

/** Garante que os parâmetros do sistema existem. Cria os que faltam; nunca altera os existentes. */
@Injectable()
export class SystemParametersSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemParametersSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    for (const seed of SYSTEM_PARAMETERS) {
      await this.prisma.parameterDefinition.upsert({
        where: { systemKey: seed.systemKey },
        create: {
          systemKey: seed.systemKey,
          name: seed.name,
          unit: seed.unit,
          minValue: seed.min,
          maxValue: seed.max,
          enabledByDefault: seed.enabledByDefault,
          sortOrder: seed.sortOrder,
        },
        update: {}, // não sobrescreve ajustes feitos no banco
      });
    }
    this.logger.log(`Parâmetros do sistema verificados (${SYSTEM_PARAMETERS.length}).`);
  }
}
