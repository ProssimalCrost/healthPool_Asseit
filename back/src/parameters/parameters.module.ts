import { Module } from '@nestjs/common';
import { ParametersController } from './parameters.controller.js';
import { ParametersService } from './parameters.service.js';
import { SystemParametersSeeder } from './system-parameters.seeder.js';

@Module({
  controllers: [ParametersController],
  providers: [ParametersService, SystemParametersSeeder],
})
export class ParametersModule {}
