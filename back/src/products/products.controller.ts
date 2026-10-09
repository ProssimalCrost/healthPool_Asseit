import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ListProductUsagesQuery } from './dto/list-product-usages.query.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import type { ProductDto, ProductUsagePage } from './product.dto.js';
import { ProductsService } from './products.service.js';

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  list(): Promise<ProductDto[]> {
    return this.products.list();
  }

  @Post('products')
  create(@Body() dto: CreateProductDto): Promise<ProductDto> {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto): Promise<ProductDto> {
    return this.products.update(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.products.remove(id);
  }

  /** Produtos aplicados em uma piscina, do mais recente ao mais antigo. */
  @Get('product-usages')
  listUsages(@Query() query: ListProductUsagesQuery): Promise<ProductUsagePage> {
    return this.products.listUsages(query);
  }
}
