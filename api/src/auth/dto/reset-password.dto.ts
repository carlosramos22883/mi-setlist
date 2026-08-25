import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { PASSWORD_RULES, PASSWORD_RULE_MESSAGE } from './register.dto';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString({ message: 'Token inválido' })
  @IsNotEmpty({ message: 'Token inválido' })
  token!: string; // viene del link del correo

  @ApiProperty({ example: 'NewPassword123!' })
  @IsStrongPassword(PASSWORD_RULES, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}
