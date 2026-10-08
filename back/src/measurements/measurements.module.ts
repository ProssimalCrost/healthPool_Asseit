import { Module } from '@nestjs/common';
import { MeasurementsController } from './measurements.controller.js';
import { MeasurementsService } from './measurements.service.js';

@Module({
  controllers: [MeasurementsController],
  providers: [MeasurementsService],
})
export class MeasurementsModule {}
