import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SiweMessage } from 'siwe';
import { randomBytes, createHash } from 'crypto';
import { User } from './entities/user.entity';
import { ApiKey } from './entities/api-key.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async generateNonce(walletAddress: string): Promise<{ nonce: string }> {
    const nonce = randomBytes(32).toString('hex');
    const address = walletAddress.toLowerCase();

    let user = await this.userRepo.findOne({
      where: { walletAddress: address },
    });

    if (!user) {
      user = this.userRepo.create({ walletAddress: address, nonce });
      await this.userRepo.save(user);
    } else {
      user.nonce = nonce;
      await this.userRepo.save(user);
    }

    return { nonce };
  }

  async verify(
    message: string,
    signature: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const siweMessage = new SiweMessage(message);
    const { data } = await siweMessage.verify({ signature });
    const address = data.address.toLowerCase();

    const user = await this.userRepo.findOne({
      where: { walletAddress: address },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Generate a nonce first.');
    }

    if (user.nonce !== data.nonce) {
      throw new UnauthorizedException('Invalid nonce');
    }

    // Rotate nonce after successful verification
    user.nonce = randomBytes(32).toString('hex');
    await this.userRepo.save(user);

    const payload = {
      sub: user.id,
      wallet: user.walletAddress,
      roles: [user.role],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user) throw new UnauthorizedException('User not found');

      const newPayload = {
        sub: user.id,
        wallet: user.walletAddress,
        roles: [user.role],
      };

      return { accessToken: this.jwtService.sign(newPayload) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async createApiKey(
    userId: string,
    label?: string,
    permissions?: string[],
  ): Promise<{ id: string; key: string; prefix: string }> {
    const rawKey = `adp_${randomBytes(32).toString('hex')}`;
    const prefix = rawKey.substring(0, 8);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.apiKeyRepo.create({
      userId,
      keyHash,
      prefix,
      label: label ?? null,
      permissions: permissions ?? ['read', 'trade'],
    });

    await this.apiKeyRepo.save(apiKey);

    return { id: apiKey.id, key: rawKey, prefix };
  }

  async revokeApiKey(keyId: string, userId: string): Promise<void> {
    const key = await this.apiKeyRepo.findOne({
      where: { id: keyId, userId },
    });

    if (!key) throw new UnauthorizedException('API key not found');

    key.active = false;
    await this.apiKeyRepo.save(key);
  }

  async validateApiKey(rawKey: string): Promise<User | null> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.apiKeyRepo.findOne({
      where: { keyHash, active: true },
      relations: ['user'],
    });

    if (!apiKey) return null;

    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepo.save(apiKey);

    return apiKey.user;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepo.find({
      where: { userId, active: true },
      select: ['id', 'prefix', 'label', 'permissions', 'createdAt', 'lastUsedAt'],
    });
  }
}
