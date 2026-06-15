export const Piece = {
	Pawn: 0,
	Knight: 1,
	Bishop: 2,
	Rook: 3,
	Queen: 4,
	King: 5,
} as const;

export const Color = {
	White: 0,
	Black: 1,
} as const;

export const TimeManagementSec = {
	timeout: 0,
	forever: Infinity,
	Minute: 60,
	ThreeMin: 180,
	FiveMin: 300,
	TenMin: 600,
	ThirtyMin: 1800,
} as const;

export const CASTLE_RIGHTS = {
	WK: 0b0001, // White Kingside (1)
	WQ: 0b0010, // White Queenside (2)
	BK: 0b0100, // Black Kingside (4)
	BQ: 0b1000, // Black Queenside (8)
	NONE: 0b0000, // Neither player can castle
};
export interface ChessMove {
	from: number;
	to: number;
	promotion?: Piece;
}
export type Piece = (typeof Piece)[keyof typeof Piece];
export type Color = (typeof Color)[keyof typeof Color];
export type TimeManagementSec =
	(typeof TimeManagementSec)[keyof typeof TimeManagementSec];

export function getPieceTypeByScore(score: number): Piece {
	switch (score) {
		case 1:
			return Piece.Pawn;
		case 3:
			return Piece.Knight;
		case 3.2:
			return Piece.Bishop;
		case 5:
			return Piece.Rook;
		case 9:
			return Piece.Queen;
		default:
			return Piece.King;
	}
}
