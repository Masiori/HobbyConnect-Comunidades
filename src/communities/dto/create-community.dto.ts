import { IsString, IsNotEmpty, IsOptional,Length, IsInt, Min } from 'class-validator';

export class CreateCommunityDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number; // definido por el cliente

  @IsString()
  @IsNotEmpty()
  @Length(3, 25, { message: 'El nombre debe tener entre 3 y 25 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
