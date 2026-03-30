import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WebsocketService {
  private server!: Server;

  constructor(private redis: RedisService) {}

  setServer(server: Server) {
    this.server = server;
  }

  async subscribeToRedisEvents() {
    const channels = [
      'adp:events:batch',
      'adp:events:order',
      'adp:events:settlement',
      'adp:events:market',
      'adp:events:provider',
    ];

    for (const channel of channels) {
      await this.redis.subscribe(channel, (message) => {
        this.handleRedisMessage(channel, message);
      });
    }

    console.log(`Subscribed to ${channels.length} Redis channels`);
  }

  private handleRedisMessage(channel: string, message: string) {
    try {
      const event = JSON.parse(message);

      switch (channel) {
        case 'adp:events:batch':
          this.server.to('public').emit('batch:phase', event);
          break;
        case 'adp:events:settlement':
          this.server.to('public').emit('batch:settled', event);
          break;
        case 'adp:events:order':
          // Send to specific user room if userId is available
          if (event.userId) {
            this.server.to(`user:${event.userId}`).emit('order:status', event);
          }
          break;
        case 'adp:events:market':
          this.server.to('public').emit('market:price', event);
          break;
        case 'adp:events:provider':
          this.server.to('public').emit('provider:status', event);
          break;
      }
    } catch (err) {
      console.error(`Failed to parse Redis message on ${channel}:`, err);
    }
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitPublic(event: string, data: unknown) {
    this.server.to('public').emit(event, data);
  }
}
