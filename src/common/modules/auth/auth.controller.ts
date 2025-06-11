import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { getUserExample } from 'src/helpers/examples/get-user-example';
import { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags(camelCaseToWords(AuthController.name))
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Cookie configuration - consistent across login/logout
  private getCookieOptions(
    isProduction: boolean = process.env.NODE_ENV === 'production',
  ) {
    return {
      path: '/',
      httpOnly: false, // Set to true for production
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: isProduction ? ('none' as const) : ('lax' as const), // 'none' for cross-origin in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      domain: isProduction ? undefined : 'localhost', // Set domain appropriatel
    };
  }

  @Post('register')
  @DynamicApiExceptions(AuthService, 'register')
  @ResponseMessage('User created successfully', 201)
  create(@Body() createAuthDto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(createAuthDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @DynamicApiExceptions(AuthService, 'login')
  @ResponseMessage('Login successful', 201)
  async login(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() loginDto: LoginDto,
  ) {
    const token = await this.authService.login(loginDto);

    response.setCookie('access_token', token, this.getCookieOptions());

    return { message: 'Login successful' };
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Logout successful', 200)
  logout(@Res({ passthrough: true }) response: FastifyReply) {
    response.clearCookie('access_token', this.getCookieOptions());

    return { message: 'Logout successful' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @DynamicApiExceptions(AuthService, 'changePassword')
  @ResponseMessage('Password changed successfully', 200)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.authService.changePassword(
      request.user.id,
      changePasswordDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @DynamicApiExceptions(AuthService, 'findById')
  @ResponseMessage('User found successfully', 200, getUserExample())
  async findById(@Req() request: AuthenticatedRequest): Promise<Partial<User>> {
    return await this.authService.findById(request.user.id);
  }
}
