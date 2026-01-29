import { IGameState, IGameStateUpdate } from './game.interfaces';

// Room player interface
export interface IRoomPlayer {
  socketId: string;
  color?: string;
  playerName?: string;
}

// Alias
export type IPlayers = IRoomPlayer;

// Game room interface
export interface IGameRoom {
  roomId: string;
  players: IRoomPlayer[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
  hostSocketId: string;
  createdAt: Date;
}

// Room data interface
export interface IRoomData {
  playerCount: number;
  playerName: string;
  socketId: string;
  roomId: string;
}

// Remote game state interface
export interface IRemoteGameState {
  updatedBy: string;
  gameState: IGameStateUpdate;
  timestamp: string;
}
