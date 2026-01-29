import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { IGameRoom, IGameState, IRemoteGameState, IGameStateUpdate, IRoomPlayer } from '@ludo-game/shared-lib';

@Injectable({ providedIn: 'root' })
export class SocketService {
  Room: IGameRoom[] = [];

  private socket: Socket | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private socketIdSubject = new BehaviorSubject<string>('');
  private roomsSubject = new BehaviorSubject<IGameRoom[]>([]);
  private currentRoomSubject = new BehaviorSubject<IGameRoom | null>(null);
  private playersInRoomSubject = new BehaviorSubject<IRoomPlayer[]>([]);
  private gameStateSubject = new BehaviorSubject<IGameState | null>(null);
  private gameStartedSubject = new BehaviorSubject<IGameState | null>(null);
  private gameEndedSubject = new BehaviorSubject<any | null>(null);
  private playerLeftSubject = new BehaviorSubject<any | null>(null);
  private remoteGameStateSubject = new BehaviorSubject<IRemoteGameState | null>(
    null,
  );
  remoteGameState$ = this.remoteGameStateSubject.asObservable();

  connected$ = this.connectedSubject.asObservable();
  socketId$ = this.socketIdSubject.asObservable();
  rooms$ = this.roomsSubject.asObservable();
  currentRoom$ = this.currentRoomSubject.asObservable();
  playersInRoom$ = this.playersInRoomSubject.asObservable();
  gameState$ = this.gameStateSubject.asObservable();
  gameEnded$ = this.gameEndedSubject.asObservable();

  gameStarted$ = this.gameStartedSubject.asObservable();
  playerLeft$ = this.playerLeftSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect(): void {
    if (this.socket) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
      this.socketIdSubject.next(this.socket!.id || '');
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });

    // Room events
    this.socket.on('room-created', (data: { room: IGameRoom }) => {
      this.currentRoomSubject.next(data.room);
      this.playersInRoomSubject.next(data.room.players);
    });

    this.socket.on('room-joined', (data: { room: IGameRoom; message: string }) => {
      this.currentRoomSubject.next(data.room);
      this.playersInRoomSubject.next(data.room.players);
    });

    this.socket.on(
      'player-joined',
      (data: { room: IGameRoom; message: string }) => {
        this.currentRoomSubject.next(data.room);
        this.playersInRoomSubject.next(data.room.players);
      },
    );

    this.socket.on('player-left', (data: { room?: IGameRoom; message: string; gameState?: IGameState; playerColor?: string; playerName?: string; gameEnded?: boolean }) => {
      // Always emit to playerLeftSubject so subscribers get notified
      this.playerLeftSubject.next(data);

      if (data.room) {
        this.currentRoomSubject.next(data.room);
        this.playersInRoomSubject.next(data.room.players);
      }
      
      if (data.gameState) {
        this.gameStateSubject.next(data.gameState);
      }
    });

    this.socket.on('rooms-list', (data: { rooms: IGameRoom[] }) => {
      this.roomsSubject.next(data.rooms);
    });

    this.socket.on('game-started', (data: IGameState) => {
      this.gameStartedSubject.next(data);
    });

    this.socket.on('game-state-update', (data: IRemoteGameState) => {
      this.remoteGameStateSubject.next(data);
    });

    this.socket.on('game-ended', (data: any) => {
      this.gameEndedSubject.next(data);
    });

    this.socket.on('room-error', (data: { message: string }) => {});
  }

  createRoom(playerCount: number, playerName: string = 'Player'): void {
    if (this.socket) {
      this.socket.emit('create-room', {
        playerCount,
        playerName,
        socketId: this.socket.id,
      });
    }
  }

  joinRoom(roomId: string, playerName: string = 'Player'): void {
    if (this.socket) {
      this.socket.emit('join-room', {
        roomId,
        playerName,
        socketId: this.socket.id,
      });
    }
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leave-room', {
        socketId: this.socket.id,
      });
      this.currentRoomSubject.next(null);
      this.playersInRoomSubject.next([]);
    }
  }

  startGame(): void {
    if (this.socket) {
      this.socket.emit('start-game', {
        socketId: this.socket.id,
      });
    }
  }

  getRoomsList(): void {
    if (this.socket) {
      this.socket.emit('get-rooms-list');
    }
  }

  sendGameStateUpdate(gameStateUpdate: IGameStateUpdate): void {
    if (this.socket) {
      this.socket.emit('game-state-update', {
        updatedBy: this.socket.id,
        gameState: gameStateUpdate,
        timestamp: new Date().toISOString(),
      });
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  clearPlayerLeftState(): void {
    this.playerLeftSubject.next(null);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketId(): string {
    return this.socket?.id || '';
  }

  isConnected(): boolean {
    return this.connectedSubject.value;
  }
}
