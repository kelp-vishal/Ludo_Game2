import { IGameState, IGameStateUpdate } from './game.interfaces';

// Room player interface
export interface IRoomPlayer {
  socketId: string;
  color?: string;
  playerName?: string;
}

export interface IPlayers {
  socketId: string;
  playerName?: string;
  color?: string;
}

// Game room interface
export interface IGameRoom {
  roomId: string;
  players: IPlayers[];
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
