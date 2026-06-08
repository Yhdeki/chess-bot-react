import { ChessBoard } from "./chessBoard.ts";
import { Piece } from "./pieces.ts";

export class Player {
	score: number;
	color: boolean;
	chess_board: ChessBoard;
	pieces: Piece[];

	constructor(
		score: number,
		color: boolean,
		board: ChessBoard,
		pieces: Array<Piece>,
	) {
		this.score = score;
		this.color = color;
		this.chess_board = board;
		this.pieces = pieces;
	}
	move(
		piece: Piece,
		starting_row: number,
		starting_column: number,
		target_row: number,
		target_column: number,
	) {
		if (
			piece.isLegalMove(
				starting_row,
				starting_column,
				target_row,
				target_column,
			)
		) {

		}
	}
}
