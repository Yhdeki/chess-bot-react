import type { ChessBoard } from "./chessBoard";

export abstract class Piece {
	color: boolean;
	chess_board: ChessBoard;
	constructor(color: boolean, board: ChessBoard) {
		this.color = color;
		this.chess_board = board;
	}
	abstract move(
		row: number,
		column: number,
		target_row: number,
		target_column: number,
	): void;
	abstract isLegalMove(
		row: number,
		column: number,
		target_row: number,
		target_column: number,
	): boolean;
}

export class King extends Piece {
	score: number = Infinity;
	constructor(color: boolean, board: ChessBoard) {
		super(color, board);
	}
	move(
		row: number,
		column: number,
		target_row: number,
		target_column: number,
	) {
		if (this.isLegalMove(row, column, target_row, target_column)) {
			this.chess_board.chessBoard |= this.chess_board.whitePieces;
		}
	}
	isLegalMove(
		row: number,
		column: number,
		target_row: number,
		target_column: number,
	): boolean {
		return true;
	}
}
