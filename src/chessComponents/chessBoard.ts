import { precomputeKnights } from "./precomputedMoves.ts";
import { Piece, Color, type ChessMove } from "./types";

export class ChessBoard {
	// 12 piece bitboards: [WhitePawn, WhiteKnight..., BlackPawn... BlackKing]
	// Indexing formula: color * 6 + pieceType
	public pieces: bigint[] = new Array(12).fill(0n);

	// 2 color occupancy bitboards: [WhiteOccupancy, BlackOccupancy]
	public colors: bigint[] = new Array(2).fill(0n);
	public combinedOccupancy: bigint = 0n;

	// Lookup tables precomputed exactly ONCE when the app loads
	private static KNIGHT_ATTACKS: bigint[] = precomputeKnights();
	sideToMove: Color;
	fiftyMoveRule: any;
	totalNumOfMoves: number;
	constructor() {
		this.sideToMove = Color.White;
		this.totalNumOfMoves = 0;
		this.initializeDefaultBoard();
	}

	private initializeDefaultBoard() {
		this.pieces[Color.White * 6 + Piece.Pawn] = 0x000000000000ff00n;
		this.pieces[Color.Black * 6 + Piece.Pawn] = 0x00ff000000000000n;
		this.pieces[Color.White * 6 + Piece.Knight] = 0x0000000000000042n;
		this.pieces[Color.Black * 6 + Piece.Knight] = 0x4200000000000000n;
		this.pieces[Color.White * 6 + Piece.Bishop] = 0x0000000000000024n;
		this.pieces[Color.Black * 6 + Piece.Bishop] = 0x2400000000000000n;
		this.pieces[Color.White * 6 + Piece.Rook] = 0x0000000000000081n;
		this.pieces[Color.Black * 6 + Piece.Rook] = 0x8100000000000000n;
		this.pieces[Color.White * 6 + Piece.Queen] = 0x0000000000000008n;
		this.pieces[Color.Black * 6 + Piece.Queen] = 0x0800000000000000n;
		this.pieces[Color.White * 6 + Piece.King] = 0x0000000000000010n;
		this.pieces[Color.Black * 6 + Piece.King] = 0x1000000000000000n;

		this.updateOccupancy();
	}

	public updateOccupancy() {
		this.colors[Color.White] = this.pieces
			.slice(0, 6)
			.reduce((acc, b) => acc | b, 0n);
		this.colors[Color.Black] = this.pieces
			.slice(6, 12)
			.reduce((acc, b) => acc | b, 0n);
		this.combinedOccupancy =
			this.colors[Color.White] | this.colors[Color.Black];
	}

	public movePiece(move: ChessMove, pieceType: Piece, color: Color): void {
		const fromMask = 1n << BigInt(move.from);
		const toMask = 1n << BigInt(move.to);
		const moveMask = fromMask | toMask;
		const pIdx = color * 6 + pieceType;

		// 1. Move our piece
		this.pieces[pIdx] ^= moveMask;

		// 2. Handle potential capture
		const enemyColor = color === Color.White ? Color.Black : Color.White;
		if ((this.colors[enemyColor] & toMask) !== 0n) {
			// Find which enemy piece was on that square and remove it
			const enemyStart = enemyColor * 6;
			for (let i = enemyStart; i < enemyStart + 6; i++) {
				if ((this.pieces[i] & toMask) !== 0n) {
					this.pieces[i] ^= toMask; // Clear enemy piece
					break;
				}
			}
		}

		// 3. Recalculate occupancy masks
		this.updateOccupancy();
	}
	clone(): ChessBoard {
		return new ChessBoard();
	}
	getLegalMoves(square: number): number[] {
		return [];
	}
	getPieceAtSquare(square: number): string | null {
		return "";
	}
}
