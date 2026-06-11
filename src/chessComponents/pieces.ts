import type { ChessMove } from "./types";
export abstract class Piece {
	color: boolean;
	abstract score: number;
	constructor(color: boolean) {
		this.color = color;
	}
	abstract isLegalMove(move: ChessMove): boolean;
}

export class King extends Piece {
	score: number = Infinity;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
	isChecked(): boolean {
		return false;
	}
}

export class Queen extends Piece {
	score: number = 9;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
}
export class Rook extends Piece {
	score: number = 5;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
}
export class Bishop extends Piece {
	score: number = 3.2;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
}
export class Knight extends Piece {
	score: number = 3;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
}
export class Pawn extends Piece {
	score: number = 1;
	constructor(color: boolean) {
		super(color);
	}
	isLegalMove(move: ChessMove): boolean {
		return true;
	}
}
