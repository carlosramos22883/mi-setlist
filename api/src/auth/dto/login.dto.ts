import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'carlos@test.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}
