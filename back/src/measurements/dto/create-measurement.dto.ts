import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReadingInputDto {
  @IsUUID()
  parameterId: string;

  @IsNumber()
  @Min(-1_000_000)
  @Max(1_000_000)
  value: number;
}

/** Uma ida ao tanque: vários parâmetros medidos no mesmo momento. */
export class CreateMeasurementDto {
  @IsUUID()
  poolId: string;

  /** Data e hora da medição (ISO 8601). Se omitida, usa o momento do envio. */
  @IsOptional()
  @IsISO8601()
  measuredAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReadingInputDto)
  readings: ReadingInputDto[];
}
