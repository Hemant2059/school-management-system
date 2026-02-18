import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<
    string,
    { userId: number; schoolId: number; role: string }
  > = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      const userKey = `user_${decoded.userId}`;

      this.connectedUsers.set(client.id, {
        userId: decoded.userId,
        schoolId: decoded.schoolId,
        role: decoded.role,
      });

      client.join(`school_${decoded.schoolId}`);
      client.join(`user_${decoded.userId}`);

      console.log(
        `Client connected: ${client.id} (User: ${decoded.userId}, Role: ${decoded.role})`,
      );
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    return { event: 'joined', room: data.room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.room);
    return { event: 'left', room: data.room };
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { room?: string; message: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo = this.connectedUsers.get(client.id);

    const messageData = {
      ...data,
      userId: userInfo?.userId,
      schoolId: userInfo?.schoolId,
      role: userInfo?.role,
      timestamp: new Date(),
    };

    if (data.room) {
      this.server.to(data.room).emit('message', messageData);
    } else {
      this.server.emit('message', messageData);
    }

    return { event: 'messageSent', data: messageData };
  }

  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  sendToSchool(schoolId: number, event: string, data: any) {
    this.server.to(`school_${schoolId}`).emit(event, data);
  }

  sendAttendanceUpdate(schoolId: number, data: any) {
    this.sendToSchool(schoolId, 'attendanceUpdate', data);
  }

  sendExamUpdate(schoolId: number, data: any) {
    this.sendToSchool(schoolId, 'examUpdate', data);
  }

  sendFeeUpdate(schoolId: number, data: any) {
    this.sendToSchool(schoolId, 'feeUpdate', data);
  }

  sendNotification(userId: number, notification: any) {
    this.sendToUser(userId, 'notification', notification);
  }

  sendLiveClassUpdate(schoolId: number, data: any) {
    this.sendToSchool(schoolId, 'liveClassUpdate', data);
  }
}
