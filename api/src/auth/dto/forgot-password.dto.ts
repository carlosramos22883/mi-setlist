import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'carlos@test.com' })
  @IsEmail({}, { message: 'Debes ingresar un correo válido' })
  email!: string;
}
