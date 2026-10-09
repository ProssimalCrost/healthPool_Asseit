import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';

/** No PATCH, campo ausente = não muda. alertThreshold: null remove o alerta. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
