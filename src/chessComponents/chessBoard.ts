import {
	precomputeKnights,
	getRookAttacks,
	getBishopAttacks,
	getQueenAttacks,
} from "./precomputedMoves.ts";
import { Piece, Color, CASTLE_RIGHTS, type ChessMove } from "./types";

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

	// en-passant target square (index) if available
	enPassantSquare: number | null = null;

	// for fifty-move rule
	halfMoveClock: number = 0;

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
	/**
	 * Returns true if `square` is attacked by `byColor`.
	 */
	public isSquareAttacked(square: number, byColor: Color): boolean {
		const enemyPawnBB = this.pieces[byColor * 6 + Piece.Pawn];
		const enemyKnightBB = this.pieces[byColor * 6 + Piece.Knight];
		const enemyBishopBB = this.pieces[byColor * 6 + Piece.Bishop];
		const enemyRookBB = this.pieces[byColor * 6 + Piece.Rook];
		const enemyQueenBB = this.pieces[byColor * 6 + Piece.Queen];
		const enemyKingBB = this.pieces[byColor * 6 + Piece.King];
		const occ = this.combinedOccupancy;

		// Pawn attacks: check squares where an enemy pawn would sit to attack `square`
		if (byColor === Color.White) {
			const fromLeft = square - 9;
			const fromRight = square - 7;
			if (fromLeft >= 0 && (enemyPawnBB & sqToBB(fromLeft)) !== 0n)
				return true;
			if (fromRight >= 0 && (enemyPawnBB & sqToBB(fromRight)) !== 0n)
				return true;
		} else {
			const fromLeft = square + 7;
			const fromRight = square + 9;
			if (fromLeft <= 63 && (enemyPawnBB & sqToBB(fromLeft)) !== 0n)
				return true;
			if (fromRight <= 63 && (enemyPawnBB & sqToBB(fromRight)) !== 0n)
				return true;
		}

		// Knights
		if ((ChessBoard.KNIGHT_ATTACKS[square] & enemyKnightBB) !== 0n)
			return true;

		// Bishops / Queens (diagonals)
		if (
			(getBishopAttacks(square, occ) & (enemyBishopBB | enemyQueenBB)) !==
			0n
		)
			return true;

		// Rooks / Queens (straight)
		if ((getRookAttacks(square, occ) & (enemyRookBB | enemyQueenBB)) !== 0n)
			return true;

		// King (adjacent)
		const deltas = [-9, -8, -7, -1, 1, 7, 8, 9];
		for (const d of deltas) {
			const s = square + d;
			if (s < 0 || s > 63) continue;
			if ((enemyKingBB & sqToBB(s)) !== 0n) return true;
		}

		return false;
	}

	public movePiece(move: ChessMove, pieceType: Piece, color: Color): void {
		const fromMask = 1n << BigInt(move.from);
		const toMask = 1n << BigInt(move.to);
		const pIdx = color * 6 + pieceType;

		let capturedEnPassant = false;
		const enemyColor = color === Color.White ? Color.Black : Color.White;

		// Castling handling for king
		if (pieceType === Piece.King) {
			if (color === Color.White) {
				// White kingside
				if (
					move.from === 4 &&
					move.to === 6 &&
					this.canCastle(CASTLE_RIGHTS.WK)
				) {
					// move rook h1 to f1
					this.pieces[Color.White * 6 + Piece.Rook] &= ~sqToBB(7);
					this.pieces[Color.White * 6 + Piece.Rook] |= sqToBB(5);
				}
				// White queen-side
				if (
					move.from === 4 &&
					move.to === 2 &&
					this.canCastle(CASTLE_RIGHTS.WQ)
				) {
					this.pieces[Color.White * 6 + Piece.Rook] &= ~sqToBB(0);
					this.pieces[Color.White * 6 + Piece.Rook] |= sqToBB(3);
				}
				this.revokeCastlingRights(CASTLE_RIGHTS.WK | CASTLE_RIGHTS.WQ);
			} else {
				// Black kingside
				if (
					move.from === 60 &&
					move.to === 62 &&
					this.canCastle(CASTLE_RIGHTS.BK)
				) {
					this.pieces[Color.Black * 6 + Piece.Rook] &= ~sqToBB(63);
					this.pieces[Color.Black * 6 + Piece.Rook] |= sqToBB(61);
				}
				// Black queen-side
				if (
					move.from === 60 &&
					move.to === 58 &&
					this.canCastle(CASTLE_RIGHTS.BQ)
				) {
					this.pieces[Color.Black * 6 + Piece.Rook] &= ~sqToBB(56);
					this.pieces[Color.Black * 6 + Piece.Rook] |= sqToBB(59);
				}
				this.revokeCastlingRights(CASTLE_RIGHTS.BK | CASTLE_RIGHTS.BQ);
			}
		}

		// En-passant capture
		if (pieceType === Piece.Pawn && this.enPassantSquare === move.to) {
			const capturedPawnSquare =
				color === Color.White ? move.to - 8 : move.to + 8;
			this.pieces[enemyColor * 6 + Piece.Pawn] &=
				~sqToBB(capturedPawnSquare);
			capturedEnPassant = true;
		}

		// Normal capture
		if ((this.combinedOccupancy & toMask) !== 0n) {
			for (let i = enemyColor * 6; i < enemyColor * 6 + 6; i++) {
				if ((this.pieces[i] & toMask) !== 0n) {
					this.pieces[i] &= ~toMask;
					break;
				}
			}
		}

		// Move piece
		this.pieces[pIdx] &= ~fromMask;
		this.pieces[pIdx] |= toMask;

		// Rook moved -> revoke castling rights for that rook side
		if (pieceType === Piece.Rook) {
			if (color === Color.White) {
				if (move.from === 0)
					this.revokeCastlingRights(CASTLE_RIGHTS.WQ);
				if (move.from === 7)
					this.revokeCastlingRights(CASTLE_RIGHTS.WK);
			} else {
				if (move.from === 56)
					this.revokeCastlingRights(CASTLE_RIGHTS.BQ);
				if (move.from === 63)
					this.revokeCastlingRights(CASTLE_RIGHTS.BK);
			}
		}

		// If we captured a rook on destination, revoke opponent castling rights
		if (!capturedEnPassant) {
			if (move.to === 0) this.revokeCastlingRights(CASTLE_RIGHTS.WQ);
			if (move.to === 7) this.revokeCastlingRights(CASTLE_RIGHTS.WK);
			if (move.to === 56) this.revokeCastlingRights(CASTLE_RIGHTS.BQ);
			if (move.to === 63) this.revokeCastlingRights(CASTLE_RIGHTS.BK);
		}

		// en-passant square update
		this.enPassantSquare = null;
		if (pieceType === Piece.Pawn) {
			if (color === Color.White && move.to - move.from === 16)
				this.enPassantSquare = move.from + 8;
			if (color === Color.Black && move.from - move.to === 16)
				this.enPassantSquare = move.from - 8;
		}

		// Promotion -> promote to queen
		if (pieceType === Piece.Pawn) {
			const rank = Math.floor(move.to / 8);
			if (
				(color === Color.White && rank === 7) ||
				(color === Color.Black && rank === 0)
			) {
				this.pieces[color * 6 + Piece.Pawn] &= ~toMask;
				this.pieces[color * 6 + Piece.Queen] |= toMask;
			}
		}

		// Recalculate occupancy and change side
		this.updateOccupancy();
		this.sideToMove = enemyColor;
		this.totalNumOfMoves++;
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

		const enemyColor =
			foundPiece.color === Color.White ? Color.Black : Color.White;
		const enemyBits = this.colors[enemyColor];
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
			movesMask &= ~ownPieces;
			// castling
			if (color === Color.White) {
				if (this.canCastle(CASTLE_RIGHTS.WK)) {
					// squares 5 and 6 must be empty and not attacked
					if (
						(allOcc & sqToBB(5)) === 0n &&
						(allOcc & sqToBB(6)) === 0n &&
						!this.isSquareAttacked(4, enemyColor) &&
						!this.isSquareAttacked(5, enemyColor) &&
						!this.isSquareAttacked(6, enemyColor)
					) {
						movesMask |= sqToBB(6);
					}
				}
				if (this.canCastle(CASTLE_RIGHTS.WQ)) {
					if (
						(allOcc & sqToBB(1)) === 0n &&
						(allOcc & sqToBB(2)) === 0n &&
						(allOcc & sqToBB(3)) === 0n &&
						!this.isSquareAttacked(4, enemyColor) &&
						!this.isSquareAttacked(3, enemyColor) &&
						!this.isSquareAttacked(2, enemyColor)
					) {
						movesMask |= sqToBB(2);
					}
				}
			} else {
				if (this.canCastle(CASTLE_RIGHTS.BK)) {
					if (
						(allOcc & sqToBB(61)) === 0n &&
						(allOcc & sqToBB(62)) === 0n &&
						!this.isSquareAttacked(60, enemyColor) &&
						!this.isSquareAttacked(61, enemyColor) &&
						!this.isSquareAttacked(62, enemyColor)
					) {
						movesMask |= sqToBB(62);
					}
				}
				if (this.canCastle(CASTLE_RIGHTS.BQ)) {
					if (
						(allOcc & sqToBB(57)) === 0n &&
						(allOcc & sqToBB(58)) === 0n &&
						(allOcc & sqToBB(59)) === 0n &&
						!this.isSquareAttacked(60, enemyColor) &&
						!this.isSquareAttacked(59, enemyColor) &&
						!this.isSquareAttacked(58, enemyColor)
					) {
						movesMask |= sqToBB(58);
					}
				}
			}
		} else if (pieceType === Piece.Pawn) {
			if (color === Color.White) {
				const one = squareIdx + 8;
				if (one <= 63 && (allOcc & sqToBB(one)) === 0n) addIfValid(one);
				const rank = rankOf(squareIdx);
				if (rank === 1) {
					const two = squareIdx + 16;
					if (
						(allOcc & sqToBB(two)) === 0n &&
						(allOcc & sqToBB(one)) === 0n
					)
						addIfValid(two);
				}
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
			// use magic bitboards for sliding pieces
			if (pieceType === Piece.Bishop) {
				movesMask = getBishopAttacks(squareIdx, allOcc) & ~ownPieces;
			} else if (pieceType === Piece.Rook) {
				movesMask = getRookAttacks(squareIdx, allOcc) & ~ownPieces;
			} else {
				movesMask = getQueenAttacks(squareIdx, allOcc) & ~ownPieces;
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
