export interface IRoom {
  roomId: string;
  players: IPlayers[];
  maxPlayers: number;
  currentPlayers: number;
  gameStarted: boolean;
  hostSocketId: string;
}

export interface IPlayers{
  socketId: string;
  playerName?: string;
  color?: string;
}
