import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { ScoringService } from './scoring.service';
import { MatchesService } from '../matches/matches.service';
import {
  WebSocketEvent,
  WebSocketMessage,
  JoinMatchMessage,
  ScorePointMessage,
  UndoPointMessage,
  MatchUpdatedMessage,
  ErrorMessage,
} from '@repo/types';

interface ExtendedWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  matchRooms: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ScoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, ExtendedWebSocket>();
  private matchRooms = new Map<string, Set<string>>();

  constructor(
    private scoringService: ScoringService,
    private matchesService: MatchesService,
  ) {}

  handleConnection(client: ExtendedWebSocket) {
    const clientId = this.generateId();
    client.id = clientId;
    client.isAlive = true;
    client.matchRooms = new Set();
    this.clients.set(clientId, client);

    console.log(`Client connected: ${clientId}`);

    // Setup heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });
  }

  handleDisconnect(client: ExtendedWebSocket) {
    // Remove from all rooms
    client.matchRooms.forEach((matchId) => {
      const room = this.matchRooms.get(matchId);
      if (room) {
        room.delete(client.id);
        if (room.size === 0) {
          this.matchRooms.delete(matchId);
        }
      }
    });

    this.clients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WebSocketEvent.JOIN_MATCH)
  async handleJoinMatch(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: JoinMatchMessage,
  ) {
    try {
      const { matchId } = data;

      // Add client to match room
      if (!this.matchRooms.has(matchId)) {
        this.matchRooms.set(matchId, new Set());
      }
      this.matchRooms.get(matchId)!.add(client.id);
      client.matchRooms.add(matchId);

      // Send current match state
      const match = await this.matchesService.findOne(matchId);
      const score = await this.scoringService.getScore(matchId);

      this.sendToClient(client, {
        event: WebSocketEvent.MATCH_UPDATED,
        data: { match, score },
        timestamp: new Date(),
      });

      console.log(`Client ${client.id} joined match ${matchId}`);
    } catch (error) {
      this.sendError(client, error.message);
    }
  }

  @SubscribeMessage(WebSocketEvent.LEAVE_MATCH)
  handleLeaveMatch(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: JoinMatchMessage,
  ) {
    const { matchId } = data;
    const room = this.matchRooms.get(matchId);
    if (room) {
      room.delete(client.id);
      if (room.size === 0) {
        this.matchRooms.delete(matchId);
      }
    }
    client.matchRooms.delete(matchId);
    console.log(`Client ${client.id} left match ${matchId}`);
  }

  @SubscribeMessage(WebSocketEvent.SCORE_POINT)
  async handleScorePoint(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: ScorePointMessage,
  ) {
    try {
      const { matchId, pointWinner } = data;

      // Initialize score if needed
      let score = await this.scoringService.getScore(matchId);
      if (!score) {
        score = await this.scoringService.initializeMatchScore(matchId);
      }

      // Score the point
      const updatedScore = await this.scoringService.scorePoint(
        matchId,
        pointWinner,
      );
      const match = await this.matchesService.findOne(matchId);

      // Broadcast to all clients in the match room
      this.broadcastToMatch(matchId, {
        event: WebSocketEvent.POINT_SCORED,
        data: { match, score: updatedScore },
        timestamp: new Date(),
      });

      console.log(
        `Point scored in match ${matchId} by player ${pointWinner}`,
      );

      // Check if match is completed
      if (updatedScore.winnerId) {
        this.broadcastToMatch(matchId, {
          event: WebSocketEvent.MATCH_ENDED,
          data: { match, score: updatedScore },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.sendError(client, error.message);
    }
  }

  @SubscribeMessage(WebSocketEvent.UNDO_POINT)
  async handleUndoPoint(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: UndoPointMessage,
  ) {
    try {
      const { matchId } = data;

      const updatedScore = await this.scoringService.undoPoint(matchId);
      const match = await this.matchesService.findOne(matchId);

      // Broadcast to all clients in the match room
      this.broadcastToMatch(matchId, {
        event: WebSocketEvent.MATCH_UPDATED,
        data: { match, score: updatedScore },
        timestamp: new Date(),
      });

      console.log(`Point undone in match ${matchId}`);
    } catch (error) {
      this.sendError(client, error.message);
    }
  }

  @SubscribeMessage(WebSocketEvent.START_MATCH)
  async handleStartMatch(
    @ConnectedSocket() client: ExtendedWebSocket,
    @MessageBody() data: JoinMatchMessage,
  ) {
    try {
      const { matchId } = data;

      const score = await this.scoringService.initializeMatchScore(matchId);
      const match = await this.matchesService.findOne(matchId);

      this.broadcastToMatch(matchId, {
        event: WebSocketEvent.MATCH_STARTED,
        data: { match, score },
        timestamp: new Date(),
      });

      console.log(`Match ${matchId} started`);
    } catch (error) {
      this.sendError(client, error.message);
    }
  }

  // Helper methods

  private broadcastToMatch(matchId: string, message: WebSocketMessage) {
    const room = this.matchRooms.get(matchId);
    if (!room) return;

    room.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client) {
        this.sendToClient(client, message);
      }
    });
  }

  private sendToClient(client: ExtendedWebSocket, message: WebSocketMessage) {
    if (client.readyState === 1) {
      // OPEN
      client.send(JSON.stringify(message));
    }
  }

  private sendError(client: ExtendedWebSocket, errorMessage: string) {
    this.sendToClient(client, {
      event: WebSocketEvent.ERROR,
      data: { message: errorMessage } as ErrorMessage,
      timestamp: new Date(),
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Heartbeat to detect dead connections
  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          this.clients.delete(clientId);
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000); // 30 seconds
  }
}

