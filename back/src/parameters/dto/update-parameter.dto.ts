import { PartialType } from '@nestjs/mapped-types';
import { CreateParameterDto } from './create-parameter.dto.js';

/** No PATCH, campo ausente = não muda; min/max com null = limpar o limite. */
export class UpdateParameterDto extends PartialType(CreateParameterDto) {}
