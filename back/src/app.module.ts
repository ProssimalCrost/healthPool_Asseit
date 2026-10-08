import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessKeyGuard } from './access/access-key.guard.js';
import { HealthController } from './health/health.controller.js';
import { MeasurementsModule } from './measurements/measurements.module.js';
import { ParametersModule } from './parameters/parameters.module.js';
import { PoolsModule } from './pools/pools.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ParametersModule, PoolsModule, MeasurementsModule],
  controllers: [HealthController],
  // Guard global: toda rota exige o código de acesso, menos as marcadas com @Public().
  providers: [{ provide: APP_GUARD, useClass: AccessKeyGuard }],
})
export class AppModule {}
