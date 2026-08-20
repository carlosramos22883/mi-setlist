import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO = la "forma" de los datos que aceptamos en el endpoint.
// El ValidationPipe de main.ts valida TODO automáticamente con estos decoradores.
//
// NOTA sobre el "!": los valores los asigna class-transformer al recibir
// el JSON; con "!" le prometemos a TS que siempre estarán asignados.
export class RegisterDto {
  @ApiProperty({ example: 'Carlos Ramos' }) // aparece en Swagger como ejemplo
  @IsString() // debe ser texto
  @IsNotEmpty() // no puede venir vacío
  name!: string;

  @ApiProperty({ example: 'carlos@test.com' })
  @IsEmail() // debe tener formato de correo válido
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8) // mínimo 8 caracteres
  password!: string;
}
