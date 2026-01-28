// Game state interface for synchronizing game state across clients
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

// Game state update interface for remote synchronization
export interface IGameStateUpdate {
  currentTurn: number;
  diceValue: number;
  pieces: { [pieceId: string]: number };
  movablePieces: string[];
  timestamp: Date;
  lastMove?: {
    pieceId: string;
    fromPos: number;
    toPos: number;
  };
}
