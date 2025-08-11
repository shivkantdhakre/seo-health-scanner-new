import { 
  Controller, 
  Post, 
  Body, 
  Res, 
  Get, 
  UseGuards, 
  Req, 
  UnauthorizedException // Import UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.signup(body.email, body.password);
    response.cookie('jwt', access_token, { httpOnly: true });
    return { message: 'Signup successful' };
  }

  @Post('login')
  async login(@Body() body, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    
    // This is the updated logic.
    // If the user is not found or password doesn't match, throw a 401 error.
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { access_token } = await this.authService.login(user);
    response.cookie('jwt', access_token, { httpOnly: true });
    return { message: 'Login successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    // This protected route will only work if the user sends a valid JWT cookie.
    return req.user;
  }
}