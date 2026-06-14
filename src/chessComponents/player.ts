import { ChessBoard } from "./chessBoard.ts";
import { Piece } from "./pieces.ts";
import {
	getPieceTypeByScore,
	TimeManagementSec,
	type ChessMove,
} from "./types.ts";
import { Color } from "./types.ts";

export class Player {
	score: number;
	color: boolean;
	chessBoard: ChessBoard;
	pieces: Piece[];
	timeLeft: number;

	constructor(color: boolean, board: ChessBoard, pieces: Array<Piece>) {
		this.score = 0;
		this.color = color;
		this.chessBoard = board;
		this.pieces = pieces;
		this.timeLeft = TimeManagementSec.TenMin;
	}
	movePiece(piece: Piece, move: ChessMove) {
		if (this.isLegalMove(move)) {
			this.chessBoard.movePiece(
				move,
				getPieceTypeByScore(piece.score),
				this.color ? Color.White : Color.Black,
			);
		}
	}
	isLegalMove(move: ChessMove) {
		return move.to in this.chessBoard.getLegalMoves(move.from, this.color);
	}
}
