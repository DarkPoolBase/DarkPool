import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://darkpoolweb.vercel.app',
      'https://www.darkpoolbase.org',
    ],
    credentials: true,
  },
  pingInterval: 30000,
  pingTimeout: 60000,
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private wsService: WebsocketService,
  ) {}

  afterInit() {
    this.wsService.setServer(this.server);
    this.wsService.subscribeToRedisEvents();
    console.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') as string);

      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.userId = payload.sub;
        client.data.wallet = payload.wallet;
        // Join user-specific room for private events
        await client.join(`user:${payload.sub}`);
      }

      // All clients join public room
      await client.join('public');
      console.log(`Client connected: ${client.id}`);
    } catch {
      // Allow unauthenticated clients for public data
      await client.join('public');
      console.log(`Client connected (unauthenticated): ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}

