import { PartialType } from '@nestjs/mapped-types';
import { CreatePoolDto } from './create-pool.dto.js';

/** No PATCH, campo ausente = não muda. parameterIds, quando enviado, substitui a lista inteira. */
export class UpdatePoolDto extends PartialType(CreatePoolDto) {}
