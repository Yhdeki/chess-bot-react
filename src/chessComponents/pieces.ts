export abstract class Piece {
	abstract color: boolean;
	abstract score: number;
}

export class King extends Piece {
	color: boolean;
	score: number = Infinity;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
	isChecked(): boolean {
		return false;
	}
}

export class Queen extends Piece {
	color: boolean;
	score: number = 9;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
}
export class Rook extends Piece {
	color: boolean;
	score: number = 5;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
}
export class Bishop extends Piece {
	color: boolean;
	score: number = 3.2;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
}
export class Knight extends Piece {
	color: boolean;
	score: number = 3;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
}
export class Pawn extends Piece {
	color: boolean;
	score: number = 1;
	constructor(color: boolean) {
		super();
		this.color = color;
	}
}
