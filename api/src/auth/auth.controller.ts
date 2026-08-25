import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt-payload'; // ← tipo compartido
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth') // → /api/v1/auth
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /auth/register — público
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // POST /auth/login — público
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // POST /auth/refresh — público
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  // GET /auth/verify-email?token=... — público
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  // GET /auth/me — PROTEGIDO; user ya viene tipado como JwtPayload
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub); // user.sub = id del usuario
  }

  // POST /auth/logout — PROTEGIDO
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Body() dto: LogoutDto) {
    return this.auth.logout(user.sub, dto.refreshToken);
  }

  // POST /api/v1/auth/forgot-password — público
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  // POST /api/v1/auth/reset-password — público (el token es la llave)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
