import { ChessBoard } from "./chessBoard";
import { Piece } from "./pieces";

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
}
