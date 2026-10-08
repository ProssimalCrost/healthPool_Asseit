import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreatePoolDto {
  @Transform(trim)
  @IsString()
  @Length(1, 60, { message: 'O nome deve ter de 1 a 60 caracteres.' })
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  volumeLiters?: number | null;

  /** Parâmetros acompanhados. Se omitido, usa os padrão (pH, cloro livre, alcalinidade). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  parameterIds?: string[];
}
