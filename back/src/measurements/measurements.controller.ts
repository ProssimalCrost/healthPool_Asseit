import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreateMeasurementDto } from './dto/create-measurement.dto.js';
import { ListMeasurementsQuery } from './dto/list-measurements.query.js';
import type { MeasurementDto, MeasurementPage } from './measurement.dto.js';
import { MeasurementsService } from './measurements.service.js';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurements: MeasurementsService) {}

  @Post()
  create(@Body() dto: CreateMeasurementDto): Promise<MeasurementDto[]> {
    return this.measurements.create(dto);
  }

  @Get()
  list(@Query() query: ListMeasurementsQuery): Promise<MeasurementPage> {
    return this.measurements.list(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.measurements.remove(id);
  }
}
