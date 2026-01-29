import { IPlayers } from './socket.interfaces';

export interface IPiece {
  id: string;
  color: string;
  position: number;
  currentX: number;
  currentY: number;
}

export interface ILastMove {
  pieceId: string;
  fromPos: number;
  toPos: number;
}

export interface IGameState {
  activePlayers: string[];
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  gameWon: string | null;
  movablePieces: string[];
  timestamp: Date;
  room: string | null;
}

export interface IAvailableRoom {
  roomId: string;
  players: IPlayers[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
}
export interface IGameStateUpdate {
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  movablePieces: string[];
  timestamp: Date;
  lastMove?: ILastMove;
}
