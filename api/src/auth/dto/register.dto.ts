import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

// Regla de contraseña compartida (registro y recuperación)
export const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

export const PASSWORD_RULE_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo';

export class RegisterDto {
  @ApiProperty({ example: 'Carlos Ramos' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiProperty({ example: 'carlos@test.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsStrongPassword(PASSWORD_RULES, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}
