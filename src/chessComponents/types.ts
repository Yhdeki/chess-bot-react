export const PieceType = {
	Pawn: 0,
	Knight: 1,
	Bishop: 2,
	Rook: 3,
	Queen: 4,
	King: 5,
} as const;
export interface ChessPiece {
	pieceType: PieceType;
	color: Color;
}
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
	WQ: 0b0010, // White Queen-side (2)
	BK: 0b0100, // Black Kingside (4)
	BQ: 0b1000, // Black Queen-side (8)
	NONE: 0b0000, // Neither player can castle
};
export interface ChessMove {
	from: number;
	to: number;
	promotion?: PieceType;
}
export type PieceType = (typeof PieceType)[keyof typeof PieceType];
export type Color = (typeof Color)[keyof typeof Color];
export type TimeManagementSec =
	(typeof TimeManagementSec)[keyof typeof TimeManagementSec];

export function getPieceTypeByScore(score: number): PieceType {
	switch (score) {
		case 1:
			return PieceType.Pawn;
		case 3:
			return PieceType.Knight;
		case 3.2:
			return PieceType.Bishop;
		case 5:
			return PieceType.Rook;
		case 9:
			return PieceType.Queen;
		default:
			return PieceType.King;
	}
}
export function getPieceNameByType(type: PieceType): string | null {
	switch (type) {
		case PieceType.Pawn:
			return "pawn";
		case PieceType.Knight:
			return "knight";
		case PieceType.Bishop:
			return "bishop";
		case PieceType.Rook:
			return "rook";
		case PieceType.Queen:
			return "queen";
		case PieceType.King:
			return "king";
		default:
			return null;
	}
}
