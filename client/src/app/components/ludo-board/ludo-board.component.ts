import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IPiece } from '../../interfaces/ludo-board.interfaces';
import { IGameState, IGameStateUpdate } from '@ludo-game/shared-lib';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { RoomService } from '../../services/room.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ludo-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ludo-board.component.html',
  styleUrls: ['./ludo-board.component.scss'],
})
export class LudoBoardComponent implements OnInit, OnDestroy {
  Math = Math;
  valueDice = signal(1);

  pieces: IPiece[] = [];
  gameState: IGameState | null = null;
  gridCells = Array(225).fill(0);

  gameService = inject(GameService);
  socketService = inject(SocketService);
  roomService = inject(RoomService);
  router = inject(Router);

  pieces$ = this.gameService.pieces$;
  currentRoom$ = this.roomService.currentRoom$;
  players$ = this.roomService.players$;

  private subscriptions: Subscription[] = [];

  isRolling = false;

  ngOnInit(): void {
    // Subscribe to pieces changes
    const piecesSubscription = this.gameService.pieces$.subscribe(
      (pieces) => {
        this.pieces = pieces;
      },
    );

    // Subscribe to gameState changes
    const gameStateSubscription = this.gameService.gameState$.subscribe(
      (state) => {
        this.gameState = state;
        // DON'T update valueDice here - it's managed by rollDice() and remote updates
      },
    );

    // Subscribe to socket game state updates from other players
    const socketStateSubscription =
      this.socketService.remoteGameState$.subscribe((remoteState) => {
        if (remoteState) {
          this.gameService.applyRemoteGameState(remoteState.gameState);
          // Update dice value display for all players
          if (remoteState.gameState.diceValue > 0) {
            this.valueDice.set(remoteState.gameState.diceValue);
          } else {
            // Reset dice to 1 when no active dice roll
            this.valueDice.set(1);
          }
        }
      });

    // Subscribe to game-ended event
    const gameEndedSubscription = this.socketService.gameEnded$.subscribe(
      (data) => {
        if (data) {
          if (this.gameState) {
            this.gameState.gameWon = data.winner || 'GAME_ENDED';
          }
          alert(
            `Game Ended: ${data.reason}\n${data.winner ? `Winner: ${data.winner}` : ''}`,
          );
        }
      },
    );

    // Subscribe to player-left event during active game
    const playerLeftSubscription = this.socketService.playerLeft$.subscribe(
      (data: { playerColor?: string; playerName?: string; gameEnded?: boolean }) => {
        if (!data) return;

        // Check if game ended because player left
        if (data.gameEnded) {
          alert(`${data.playerName || 'A player'} left and no sufficient players left to play. Returning to home...`);
          this.router.navigate(['/']);
          return;
        }

        // Handle player leaving during active game (but game continues)
        if (data.playerColor && this.gameState) {
          // Remove disconnected player from active players
          this.gameState.activePlayers = this.gameState.activePlayers.filter(
            (color) => color !== data.playerColor
          );

          // Remove all their pieces from the board
          Object.keys(this.gameState.pieces).forEach((pieceId) => {
            if (pieceId.startsWith(data.playerColor!)) {
              delete this.gameState!.pieces[pieceId];
            }
          });

          // Adjust current turn if needed
          if (this.gameState.activePlayers.length > 0) {
            this.gameState.currentTurn = 
              this.gameState.currentTurn % this.gameState.activePlayers.length;
          }

          // Clear movable pieces if it was their turn
          this.gameState.movablePieces = [];
          this.gameState.diceValue = 0;

          // Update the game state
          this.gameService.updateGameState(this.gameState);
          
          // Show notification
          alert(`${data.playerName || data.playerColor} has disconnected. Game continues with ${this.gameState.activePlayers.length} players.`);
        }
      }
    );

    this.subscriptions.push(piecesSubscription, gameStateSubscription, socketStateSubscription, gameEndedSubscription, playerLeftSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    // Clear the player-left state to prevent stale alerts on next game
    this.socketService.clearPlayerLeftState();
  }

  syncGameStateWithOthers(
    lastMovedPieceId?: string,
    fromPos?: number,
    toPos?: number,
  ): void {
    if (this.gameState) {
      const updateData: IGameStateUpdate = {
        currentTurn: this.gameState.currentTurn,
        diceValue: this.gameState.diceValue,
        pieces: this.gameState.pieces,
        movablePieces: this.gameState.movablePieces,
        timestamp: new Date(),
      };

      if (
        lastMovedPieceId !== undefined &&
        fromPos !== undefined &&
        toPos !== undefined
      ) {
        updateData.lastMove = {
          pieceId: lastMovedPieceId,
          fromPos: fromPos,
          toPos: toPos,
        };
      }

      this.socketService.sendGameStateUpdate(updateData);
    }
  }

  getCurrentPlayerName(): string {
    const currentColor = this.gameService.getCurrentPlayer();
    const currentRoom = this.roomService.getCurrentRoom();

    if (!currentRoom || !currentColor) {
      return currentColor || 'Player';
    }

    const player = currentRoom.players.find((p) => p.color === currentColor);
    return player?.playerName || currentColor;
  }

  rollDice(): void {
    if (!this.gameState?.gameWon && this.isMyTurn()) {
      this.isRolling = true;

      const diceValue = this.gameService.rollDice();
      this.valueDice.set(diceValue);
      
      this.syncGameStateWithOthers();

      setTimeout(() => {
        this.isRolling = false;

        // Check if  no movable pieces
        if (this.gameState?.movablePieces?.length === 0) {
          if (this.gameState) {
            this.gameState.diceValue = 0;
            this.gameState.currentTurn =
              (this.gameState.currentTurn + 1) %
              this.gameState.activePlayers.length;
            this.gameService.updateGameState(this.gameState);
            this.syncGameStateWithOthers();
            
            // Reset dice display when turn changes
            this.valueDice.set(1);
          }
        } else {
          // Normal case

          // Auto-move if -one piece only
          if (this.gameState?.movablePieces?.length === 1) {
            const pieceId = this.gameState.movablePieces[0];

            setTimeout(() => {
              this.selectPiece(pieceId);
            }, 300);
          }
        }
      }, 800);
    }
  }

  async selectPiece(pieceId: string): Promise<void> {
    const myColor = this.gameService.getMyColor();
    const pieceColor = pieceId.split('_')[0];

    if (pieceColor !== myColor) {
      return;
    }

    const oldPos = this.gameState?.pieces[pieceId] ?? -1;

    // Calculate new position before animating
    // const diceValue = this.gameState?.diceValue ?? 0;
    // let newPos = oldPos;
    // if (oldPos === -1 && diceValue === 6) {
    //   newPos = 0;
    // } else if (oldPos >= 0) {
    //   newPos = oldPos + diceValue;
    // }

    // // Sync with othr players
    // this.syncGameStateWithOthers(pieceId, oldPos, newPos);

    const moved = await this.gameService.movePiece(
      pieceId,
      (pId: string, fromPos: number, toPos: number) => {
        this.syncGameStateWithOthers(pId, fromPos, toPos);
      },
    );
    if (moved === true) {
      const newPos = this.gameState?.pieces[pieceId] ?? -1;
      //Sync
      this.syncGameStateWithOthers(pieceId, oldPos, newPos);
      
      // Reset dice display after piece moves
      this.valueDice.set(1);
    }
  }

  getPieceScale(piece: IPiece): number {
    // Count how many pieces are at the same position
    const pieces = this.gameService.pieces || [];
    const samePosition = pieces.filter(
      (p) =>
        p.currentX === piece.currentX &&
        p.currentY === piece.currentY &&
        p.position >= 0,
    ).length;

    // Scale down if multiple pieces at same position
    return samePosition > 1 ? 0.7 : 1;
  }

  getPieceOffset(piece: IPiece): { x: number; y: number } {
    const pieces = this.gameService.pieces || [];
    const samePosArray = pieces.filter(
      (p) =>
        p.currentX === piece.currentX &&
        p.currentY === piece.currentY &&
        p.position >= 0,
    );

    if (samePosArray.length <= 1) {
      return { x: 0, y: 0 };
    }

    const index = samePosArray.findIndex((p) => p.id === piece.id);
    const offset = 8;

    // Offset pieces in a circular pattern
    return {
      x: index * offset,
      y: index * offset,
    };
  }

  IsRedTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'RED'.toLowerCase();
  }
  IsBlueTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'BLUE'.toLowerCase();
  }
  IsYellowTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'YELLOW'.toLowerCase();
  }
  IsGreenTurn(): boolean {
    return this.getCurrentPlayer().toLowerCase() === 'GREEN'.toLowerCase();

    // return this.gameService.isRedTurn();
  }

  getVisiblePieces(): IPiece[] {
    return this.gameService.getVisiblePieces();
  }

  getCurrentPlayer(): string {
    return this.gameService.getCurrentPlayer();
  }

  isGameWon(): string | null {
    return this.gameService.gameState.gameWon;
  }

  isMyTurn(): boolean {
    const currentPlayer = this.gameService.getCurrentPlayer();
    const myColor = this.gameService.getMyColor();
    return currentPlayer === myColor;
  }

  isMyPiece(piece: IPiece): boolean {
    const myColor = this.gameService.getMyColor();
    return piece.color === myColor.toLowerCase();
  }

  isRedHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 15 && col <= 5 && col >= 0;
  }

  isYellowHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 9 && row <= 14 && col >= 9;
  }

  isGreenHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 0 && row <= 5 && col >= 9;
  }

  isBlueHome(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    return row >= 0 && row <= 5 && col <= 5;
  }

  isRedBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 9 && col <= 5 && col >= 0) ||
      (row === 14 && col <= 5 && col >= 0) ||
      (col === 0 && row >= 9 && row <= 15) ||
      (col === 5 && row >= 9 && row <= 15)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isYellowBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 9 && col >= 9) ||
      (row === 14 && col >= 9) ||
      (col === 9 && row >= 9) ||
      (col === 14 && row >= 9)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isBlueBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;
    if (
      (row === 0 && col >= 0 && col <= 5) ||
      (row === 5 && col >= 0 && col <= 5) ||
      (col === 0 && row <= 5 && row >= 0) ||
      (col === 5 && row <= 5 && row >= 0)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isGreenBorder(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 0 && col >= 9) ||
      (row === 5 && col >= 9) ||
      (col === 9 && row <= 5) ||
      (col === 14 && row <= 5)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isSafeZone(index: number): boolean {
    const safeIndices = [122, 188, 36, 102, 201, 133, 23, 91];
    return safeIndices.includes(index);
  }

  isFinishZone(index: number): boolean {
    const finishIndices = [96, 97, 98, 111, 113, 112, 128, 127, 126];
    return finishIndices.includes(index);
  }

  isRedPath(index: number): boolean {
    const val = [201, 202, 187, 172, 157, 142];
    return val.includes(index);
  }
  isYellowPath(index: number): boolean {
    const val = [133, 118, 117, 116, 115, 114];
    return val.includes(index);
  }
  isGreenPath(index: number): boolean {
    const val = [23, 22, 37, 52, 67, 82];
    return val.includes(index);
  }
  isBluePath(index: number): boolean {
    const val = [91, 106, 107, 108, 109, 110];
    return val.includes(index);
  }

  isBaseAll(index: number): boolean {
    const row = Math.floor(index / 15);
    const col = index % 15;

    if (
      (row === 10 && col === 1) ||
      (row === 10 && col === 4) ||
      (row === 13 && col === 1) ||
      (row === 13 && col === 4) ||
      (row === 1 && col === 1) ||
      (row === 1 && col === 4) ||
      (row === 4 && col === 1) ||
      (row === 4 && col === 4) ||
      (row === 1 && col === 10) ||
      (row === 1 && col === 13) ||
      (row === 4 && col === 10) ||
      (row === 4 && col === 13) ||
      (row === 10 && col === 10) ||
      (row === 10 && col === 13) ||
      (row === 13 && col === 10) ||
      (row === 13 && col === 13)
    ) {
      return true;
    } else {
      return false;
    }
  }

  leaveRoom(): void {
    if (confirm('Are you sure you want to leave the room?')) {
      // Unsubscribe from all subscriptions to prevent getting the alert
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      // Clear player-left state so we don't see our own leave notification
      this.socketService.clearPlayerLeftState();
      // Emit leave room event to server
      this.socketService.leaveRoom();
      // Navigate to home
      this.router.navigate(['/']);
    }
  }
}
