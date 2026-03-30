import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres' as const,
    host: config.get<string>('DATABASE_HOST', 'localhost'),
    port: config.get<number>('DATABASE_PORT', 5432),
    username: config.get<string>('DATABASE_USER', 'adp'),
    password: config.get<string>('DATABASE_PASSWORD', 'adp'),
    database: config.get<string>('DATABASE_NAME', 'darkpool'),
    autoLoadEntities: true,
    synchronize: config.get<string>('NODE_ENV') === 'development',
    logging: config.get<string>('NODE_ENV') === 'development',
  }),
};
