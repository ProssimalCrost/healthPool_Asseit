import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CreatePoolDto } from './dto/create-pool.dto.js';
import { UpdatePoolDto } from './dto/update-pool.dto.js';
import type { PoolDto } from './pool.dto.js';
import { PoolsService } from './pools.service.js';

@Controller('pools')
export class PoolsController {
  constructor(private readonly pools: PoolsService) {}

  @Get()
  list(): Promise<PoolDto[]> {
    return this.pools.list();
  }

  @Post()
  create(@Body() dto: CreatePoolDto): Promise<PoolDto> {
    return this.pools.create(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<PoolDto> {
    return this.pools.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePoolDto): Promise<PoolDto> {
    return this.pools.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.pools.remove(id);
  }
}
