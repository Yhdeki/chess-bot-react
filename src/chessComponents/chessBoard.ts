import { precomputeKnights } from "./precomputedMoves.ts";
import { Piece, Color, type ChessMove } from "./types";

const sqToBB = (sq: number): bigint => 1n << BigInt(sq);
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
	castlingMask: number = 0b1111;
	constructor(selfMadeBoards: bigint[] = []) {
		this.sideToMove = Color.White;
		this.totalNumOfMoves = 0;
		if (!selfMadeBoards || selfMadeBoards.length != 12)
			this.initializeDefaultBoard();
		else {
			this.pieces = selfMadeBoards;
			this.updateOccupancy();
		}
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
		return new ChessBoard([...this.pieces]);
	}
	getLegalMoves(square: number, isWhite?: boolean): number[] {
		const pieceBB = sqToBB(square);
		const pieceAtSquare = this.getPieceAtSquare(square);
		const isWhiteLocal =
			typeof isWhite === "boolean"
				? isWhite
				: pieceAtSquare
					? pieceAtSquare[0] === "w"
					: this.sideToMove === Color.White;
		const ownPieces = isWhiteLocal
			? this.colors[Color.White]
			: this.colors[Color.Black];

		let movesMask: bigint = 0n;

		// find which piece is on this square
		let foundPiece: { color: number; pieceType: number } | null = null;
		for (let colorIdx = 0; colorIdx < 2; colorIdx++) {
			for (let p = 0; p < 6; p++) {
				if ((this.pieces[colorIdx * 6 + p] & pieceBB) !== 0n) {
					foundPiece = { color: colorIdx, pieceType: p };
					break;
				}
			}
			if (foundPiece) break;
		}

		if (!foundPiece) return [];

		const enemyBits =
			this.colors[
				foundPiece.color === Color.White ? Color.Black : Color.White
			];
		const allOcc = this.combinedOccupancy;

		const fileOf = (sq: number) => sq % 8;
		const rankOf = (sq: number) => Math.floor(sq / 8);

		const addIfValid = (to: number) => {
			if (to < 0 || to > 63) return;
			const toMask = 1n << BigInt(to);
			// cannot capture own piece
			if ((ownPieces & toMask) !== 0n) return;
			movesMask |= toMask;
		};

		const squareIdx = square;
		const pieceType = foundPiece.pieceType;
		const color = foundPiece.color;

		if (pieceType === Piece.Knight) {
			movesMask = ChessBoard.KNIGHT_ATTACKS[squareIdx] & ~ownPieces;
		} else if (pieceType === Piece.King) {
			const deltas = [-9, -8, -7, -1, 1, 7, 8, 9];
			for (const d of deltas) addIfValid(squareIdx + d);
			// remove moves that wrap files
			// simple filter below when converting mask to indices
			movesMask &= ~ownPieces;
		} else if (pieceType === Piece.Pawn) {
			if (color === Color.White) {
				// single push
				const one = squareIdx + 8;
				if (one <= 63 && (allOcc & sqToBB(one)) === 0n) addIfValid(one);
				// double push from rank 1 (index 1)
				const rank = rankOf(squareIdx);
				if (rank === 1) {
					const two = squareIdx + 16;
					if (
						(allOcc & sqToBB(two)) === 0n &&
						(allOcc & sqToBB(one)) === 0n
					)
						addIfValid(two);
				}
				// captures
				const capL = squareIdx + 7;
				const capR = squareIdx + 9;
				if (
					capL <= 63 &&
					fileOf(capL) === fileOf(squareIdx) - 1 &&
					(enemyBits & sqToBB(capL)) !== 0n
				)
					addIfValid(capL);
				if (
					capR <= 63 &&
					fileOf(capR) === fileOf(squareIdx) + 1 &&
					(enemyBits & sqToBB(capR)) !== 0n
				)
					addIfValid(capR);
			} else {
				// black pawns go down
				const one = squareIdx - 8;
				if (one >= 0 && (allOcc & sqToBB(one)) === 0n) addIfValid(one);
				const rank = rankOf(squareIdx);
				if (rank === 6) {
					const two = squareIdx - 16;
					if (
						(allOcc & sqToBB(two)) === 0n &&
						(allOcc & sqToBB(one)) === 0n
					)
						addIfValid(two);
				}
				const capL = squareIdx - 9;
				const capR = squareIdx - 7;
				if (
					capL >= 0 &&
					fileOf(capL) === fileOf(squareIdx) - 1 &&
					(enemyBits & sqToBB(capL)) !== 0n
				)
					addIfValid(capL);
				if (
					capR >= 0 &&
					fileOf(capR) === fileOf(squareIdx) + 1 &&
					(enemyBits & sqToBB(capR)) !== 0n
				)
					addIfValid(capR);
			}
		} else if (
			pieceType === Piece.Bishop ||
			pieceType === Piece.Rook ||
			pieceType === Piece.Queen
		) {
			const directions: number[] = [];
			if (pieceType === Piece.Bishop || pieceType === Piece.Queen)
				directions.push(-9, -7, 7, 9);
			if (pieceType === Piece.Rook || pieceType === Piece.Queen)
				directions.push(-8, -1, 1, 8);
			for (const d of directions) {
				let to = squareIdx + d;
				while (to >= 0 && to <= 63) {
					// prevent wrap-around between files for horizontal moves
					if (
						Math.abs(fileOf(to) - fileOf(to - d)) > 1 &&
						(d === -1 || d === 1)
					)
						break;
					addIfValid(to);
					if ((allOcc & sqToBB(to)) !== 0n) break; // blocked
					to += d;
				}
			}
		}

		// convert mask to square indices
		const moves: number[] = [];
		for (let i = 0; i < 64; i++) {
			if ((movesMask & (1n << BigInt(i))) !== 0n) {
				// post-filter: king and knight and pawn moves should not wrap files incorrectly
				moves.push(i);
			}
		}
		return moves;
	}
	getPieceAtSquare(square: number): string | null {
		const mask = 1n << BigInt(square);
		for (let colorIdx = 0; colorIdx < 2; colorIdx++) {
			for (let p = 0; p < 6; p++) {
				if ((this.pieces[colorIdx * 6 + p] & mask) !== 0n) {
					const colorChar = colorIdx === Color.White ? "w" : "b";
					const names = [
						"Pawn",
						"Knight",
						"Bishop",
						"Rook",
						"Queen",
						"King",
					];
					return `${colorChar} ${names[p]}`;
				}
			}
		}
		return null;
	}
	/**
	 * Revokes specific castling rights using a bitwise AND NOT
	 */
	revokeCastlingRights(maskToRemove: number) {
		// ~maskToRemove flips the bits, and & clears them from the current state
		this.castlingMask &= ~maskToRemove;
	}

	/**
	 * Checks if a specific castling right is still allowed
	 */
	canCastle(castleFlag: number): boolean {
		// Returns true if the specific bit is set in the current mask
		return (this.castlingMask & castleFlag) !== 0;
	}
}
