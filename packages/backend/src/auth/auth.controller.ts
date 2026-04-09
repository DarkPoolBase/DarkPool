import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async getNonce(@Query('address') address: string) {
    return this.authService.generateNonce(address);
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async verify(@Body() body: { message: string; signature: string }) {
    return this.authService.verify(body.message, body.signature);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(
    @Request() req: { user: { sub: string } },
    @Body() body: { label?: string; permissions?: string[] },
  ) {
    return this.authService.createApiKey(
      req.user.sub,
      body.label,
      body.permissions,
    );
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  async listApiKeys(@Request() req: { user: { sub: string } }) {
    return this.authService.getUserApiKeys(req.user.sub);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(
    @Param('id') keyId: string,
    @Request() req: { user: { sub: string } },
  ) {
    await this.authService.revokeApiKey(keyId, req.user.sub);
    return { success: true };
  }
}

