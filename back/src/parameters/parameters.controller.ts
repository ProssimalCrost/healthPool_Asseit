import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CreateParameterDto } from './dto/create-parameter.dto.js';
import { UpdateParameterDto } from './dto/update-parameter.dto.js';
import type { ParameterDto } from './parameter.dto.js';
import { ParametersService } from './parameters.service.js';

@Controller('parameters')
export class ParametersController {
  constructor(private readonly parameters: ParametersService) {}

  @Get()
  list(): Promise<ParameterDto[]> {
    return this.parameters.list();
  }

  @Post()
  create(@Body() dto: CreateParameterDto): Promise<ParameterDto> {
    return this.parameters.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateParameterDto): Promise<ParameterDto> {
    return this.parameters.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.parameters.remove(id);
  }
}
