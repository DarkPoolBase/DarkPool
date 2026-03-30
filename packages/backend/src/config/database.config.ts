import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.get<string>('DATABASE_URL');
    const isSupabase = (url || config.get<string>('DATABASE_HOST', '')).includes('supabase');

    const baseConfig = {
      type: 'postgres' as const,
      autoLoadEntities: true,
      synchronize: false,
      logging: config.get<string>('NODE_ENV') === 'development',
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
    };

    if (url) {
      return { ...baseConfig, url };
    }

    return {
      ...baseConfig,
      host: config.get<string>('DATABASE_HOST', 'localhost'),
      port: config.get<number>('DATABASE_PORT', 5432),
      username: config.get<string>('DATABASE_USER', 'adp'),
      password: config.get<string>('DATABASE_PASSWORD', 'adp'),
      database: config.get<string>('DATABASE_NAME', 'darkpool'),
    };
  },
};
