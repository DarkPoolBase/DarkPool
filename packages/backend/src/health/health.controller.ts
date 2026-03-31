import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  async check() {
    let redisStatus = 'down';
    try {
      await this.redis.getClient().ping();
      redisStatus = 'up';
    } catch {
      redisStatus = 'down';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
      },
    };
  }
}

