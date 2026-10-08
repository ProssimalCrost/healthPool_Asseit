import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, MaxLength, Max, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateParameterDto {
  @Transform(trim)
  @IsString()
  @Length(1, 40, { message: 'O nome deve ter de 1 a 40 caracteres.' })
  name: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(16, { message: 'A unidade deve ter até 16 caracteres.' })
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(-1_000_000)
  @Max(1_000_000)
  min?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-1_000_000)
  @Max(1_000_000)
  max?: number | null;
}
