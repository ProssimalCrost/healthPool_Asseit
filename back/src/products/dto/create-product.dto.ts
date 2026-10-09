import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @Length(1, 60, { message: 'O nome deve ter de 1 a 60 caracteres.' })
  name: string;

  /** Unidade do estoque, como "kg", "L" ou "un". Padrão: "un". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 16, { message: 'A unidade deve ter de 1 a 16 caracteres.' })
  unit?: string;

  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  quantity: number;

  /** Quando a quantidade ficar menor ou igual a este valor, o app avisa para repor. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  alertThreshold?: number | null;
}
