import { IRoomPlayer } from '@ludo-game/shared-lib';

export interface IPiece {
  id: string;
  color: string;
  position: number;
  currentX: number;
  currentY: number;
}

export interface IAvailableRoom {
  roomId: string;
  players: IRoomPlayer[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
}
