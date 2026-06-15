import {
	getKnightAttacks,
	getKingAttacks,
	getRookAttacks,
	getBishopAttacks,
	getQueenAttacks,
} from "./precomputedMoves.ts";
import { Piece, Color, CASTLE_RIGHTS, type ChessMove } from "./types.ts";

const sqToBB = (sq: number): bigint => 1n << BigInt(sq);

export class ChessBoard {
	public pieces: bigint[] = new Array(12).fill(0n);
	public colors: bigint[] = new Array(2).fill(0n);
	public combinedOccupancy: bigint = 0n;

	public sideToMove: Color = Color.White;
	public castlingMask: number = 0b1111;
	public enPassantSquare: number | null = null;
	public halfMoveClock: number = 0;
	public totalNumOfMoves: number = 0;

	constructor(customPieces?: bigint[]) {
		if (customPieces && customPieces.length === 12) {
			this.pieces = [...customPieces];
			this.updateOccupancy();
		} else {
			this.initializeDefaultBoard();
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
		this.colors[Color.White] = 0n;
		this.colors[Color.Black] = 0n;
		for (let i = 0; i < 64; i++) {
			if (i < 6) this.colors[Color.White] |= this.pieces[i];
			else this.colors[Color.Black] |= this.pieces[i];
		}
		this.combinedOccupancy =
			this.colors[Color.White] | this.colors[Color.Black];
	}

	public getPieceAtSquare(
		square: number,
	): { pieceType: Piece; color: Color } | null {
		const mask = sqToBB(square);
		for (let c = 0; c < 2; c++) {
			for (let p = 0; p < 6; p++) {
				if ((this.pieces[c * 6 + p] & mask) !== 0n) {
					return { pieceType: p as Piece, color: c as Color };
				}
			}
		}
		return null;
	}

	public isSquareAttacked(square: number, byColor: Color): boolean {
		const occ = this.combinedOccupancy;

		// 1. Check Slider Attacks from the objective square out
		if (
			(getBishopAttacks(square, occ) &
				(this.pieces[byColor * 6 + Piece.Bishop] |
					this.pieces[byColor * 6 + Piece.Queen])) !==
			0n
		)
			return true;
		if (
			(getRookAttacks(square, occ) &
				(this.pieces[byColor * 6 + Piece.Rook] |
					this.pieces[byColor * 6 + Piece.Queen])) !==
			0n
		)
			return true;
		if (
			(getKnightAttacks(square) &
				this.pieces[byColor * 6 + Piece.Knight]) !==
			0n
		)
			return true;
		if (
			(getKingAttacks(square) & this.pieces[byColor * 6 + Piece.King]) !==
			0n
		)
			return true;

		// 2. Pawns
		const pawns = this.pieces[byColor * 6 + Piece.Pawn];
		const sqMask = sqToBB(square);
		if (byColor === Color.White) {
			// White pawns attacking black king from down-left / down-right
			if (((sqMask >> 7n) & pawns & 0x7f7f7f7f7f7f7f7fn) !== 0n)
				return true;
			if (((sqMask >> 9n) & pawns & 0xfefefefefefefefen) !== 0n)
				return true;
		} else {
			// Black pawns attacking white king from up-left / up-right
			if (((sqMask << 7n) & pawns & 0xfefefefefefefefen) !== 0n)
				return true;
			if (((sqMask << 9n) & pawns & 0x7f7f7f7f7f7f7f7fn) !== 0n)
				return true;
		}

		return false;
	}

	public isChecked(color: Color): boolean {
		const kingBB = this.pieces[color * 6 + Piece.King];
		if (kingBB === 0n) return false;
		const kingSquare = Number(this.bitScanForward(kingBB));
		return this.isSquareAttacked(
			kingSquare,
			color === Color.White ? Color.Black : Color.White,
		);
	}

	public getPseudoLegalMoves(square: number): number[] {
		const pInfo = this.getPieceAtSquare(square);
		if (!pInfo) return [];

		const { pieceType, color } = pInfo;
		const ownPieces = this.colors[color];
		const enemyPieces =
			this.colors[color === Color.White ? Color.Black : Color.White];
		const occ = this.combinedOccupancy;
		let movesMask = 0n;

		switch (pieceType) {
			case Piece.Knight:
				movesMask = getKnightAttacks(square) & ~ownPieces;
				break;
			case Piece.King:
				movesMask = getKingAttacks(square) & ~ownPieces;
				// Castling
				if (color === Color.White) {
					if (
						this.castlingMask & CASTLE_RIGHTS.WK &&
						!(occ & 0x60n) &&
						!this.isSquareAttacked(4, Color.Black) &&
						!this.isSquareAttacked(5, Color.Black)
					)
						movesMask |= sqToBB(6);
					if (
						this.castlingMask & CASTLE_RIGHTS.WQ &&
						!(occ & 0x0en) &&
						!this.isSquareAttacked(4, Color.Black) &&
						!this.isSquareAttacked(3, Color.Black)
					)
						movesMask |= sqToBB(2);
				} else {
					if (
						this.castlingMask & CASTLE_RIGHTS.BK &&
						!(occ & 0x6000000000000000n) &&
						!this.isSquareAttacked(60, Color.White) &&
						!this.isSquareAttacked(61, Color.White)
					)
						movesMask |= sqToBB(62);
					if (
						this.castlingMask & CASTLE_RIGHTS.BQ &&
						!(occ & 0x0e00000000000000n) &&
						!this.isSquareAttacked(60, Color.White) &&
						!this.isSquareAttacked(59, Color.White)
					)
						movesMask |= sqToBB(58);
				}
				break;
			case Piece.Bishop:
				movesMask = getBishopAttacks(square, occ) & ~ownPieces;
				break;
			case Piece.Rook:
				movesMask = getRookAttacks(square, occ) & ~ownPieces;
				break;
			case Piece.Queen:
				movesMask = getQueenAttacks(square, occ) & ~ownPieces;
				break;
			case Piece.Pawn: {
				const bit = sqToBB(square);
				if (color === Color.White) {
					const singlePush = bit << 8n;
					if (!(singlePush & occ)) {
						movesMask |= singlePush;
						if (
							Math.floor(square / 8) === 1 &&
							!((bit << 16n) & occ)
						)
							movesMask |= bit << 16n;
					}
					// Captures including boundary file wrapping protection
					const capLeft = (bit << 7n) & 0x7f7f7f7f7f7f7f7fn;
					const capRight = (bit << 9n) & 0xfefefefefefefefen;
					if (
						capLeft &
						(enemyPieces |
							(this.enPassantSquare
								? sqToBB(this.enPassantSquare)
								: 0n))
					)
						movesMask |= capLeft;
					if (
						capRight &
						(enemyPieces |
							(this.enPassantSquare
								? sqToBB(this.enPassantSquare)
								: 0n))
					)
						movesMask |= capRight;
				} else {
					const singlePush = bit >> 8n;
					if (!(singlePush & occ)) {
						movesMask |= singlePush;
						if (
							Math.floor(square / 8) === 6 &&
							!((bit >> 16n) & occ)
						)
							movesMask |= bit >> 16n;
					}
					const capLeft = (bit >> 9n) & 0x7f7f7f7f7f7f7f7fn;
					const capRight = (bit >> 7n) & 0xfefefefefefefefen;
					if (
						capLeft &
						(enemyPieces |
							(this.enPassantSquare
								? sqToBB(this.enPassantSquare)
								: 0n))
					)
						movesMask |= capLeft;
					if (
						capRight &
						(enemyPieces |
							(this.enPassantSquare
								? sqToBB(this.enPassantSquare)
								: 0n))
					)
						movesMask |= capRight;
				}
				break;
			}
		}

		return this.convertMaskToSquares(movesMask);
	}

	public getLegalMoves(square: number): number[] {
		const pInfo = this.getPieceAtSquare(square);
		if (!pInfo || pInfo.color !== this.sideToMove) return [];

		const pseudo = this.getPseudoLegalMoves(square);
		const legal: number[] = [];

		for (const to of pseudo) {
			const nextSimulatedBoard = this.clone();
			nextSimulatedBoard.movePiece(
				{ from: square, to },
				pInfo.pieceType,
				pInfo.color,
			);
			// If the move leaves your own king in check, it is strictly illegal
			if (!nextSimulatedBoard.isChecked(pInfo.color)) {
				legal.push(to);
			}
		}
		return legal;
	}

	public movePiece(move: ChessMove, pieceType: Piece, color: Color): void {
		const fromMask = sqToBB(move.from);
		const toMask = sqToBB(move.to);
		const pIdx = color * 6 + pieceType;
		const enemyColor = color === Color.White ? Color.Black : Color.White;

		// 1. Reset En Passant Target status
		let nextEnPassantSquare: number | null = null;

		// 2. Handle Castling Execution
		if (pieceType === Piece.King && Math.abs(move.to - move.from) === 2) {
			if (move.to === 6) {
				// WK
				this.pieces[Color.White * 6 + Piece.Rook] ^=
					sqToBB(7) | sqToBB(5);
			} else if (move.to === 2) {
				// WQ
				this.pieces[Color.White * 6 + Piece.Rook] ^=
					sqToBB(0) | sqToBB(3);
			} else if (move.to === 62) {
				// BK
				this.pieces[Color.Black * 6 + Piece.Rook] ^=
					sqToBB(63) | sqToBB(61);
			} else if (move.to === 58) {
				// BQ
				this.pieces[Color.Black * 6 + Piece.Rook] ^=
					sqToBB(56) | sqToBB(59);
			}
		}

		// 3. Handle En Passant Capture Logic
		if (pieceType === Piece.Pawn && move.to === this.enPassantSquare) {
			const epCaptureSq =
				color === Color.White ? move.to - 8 : move.to + 8;
			this.pieces[enemyColor * 6 + Piece.Pawn] &= ~sqToBB(epCaptureSq);
		}

		// 4. Handle Standard Captures
		if ((toMask & this.combinedOccupancy) !== 0n) {
			for (let i = enemyColor * 6; i < enemyColor * 6 + 6; i++) {
				if ((this.pieces[i] & toMask) !== 0n) {
					this.pieces[i] &= ~toMask;
					break;
				}
			}
		}

		// 5. Update Moving Piece Location
		this.pieces[pIdx] &= ~fromMask;
		this.pieces[pIdx] |= toMask;

		// 6. Handle Pawn Double Steps (Setting up new EP targets)
		if (pieceType === Piece.Pawn && Math.abs(move.to - move.from) === 16) {
			nextEnPassantSquare =
				color === Color.White ? move.from + 8 : move.from - 8;
		}

		// 7. Handle Pawn Promotions
		if (
			pieceType === Piece.Pawn &&
			(Math.floor(move.to / 8) === 7 || Math.floor(move.to / 8) === 0)
		) {
			this.pieces[pIdx] &= ~toMask;
			const promoPiece =
				move.promotion !== undefined ? move.promotion : Piece.Queen;
			this.pieces[color * 6 + promoPiece] |= toMask;
		}

		// 8. Dynamic Castling Rights Revocation
		if (pieceType === Piece.King) {
			this.castlingMask &= color === Color.White ? ~3 : ~12;
		} else if (pieceType === Piece.Rook) {
			if (move.from === 0) this.castlingMask &= ~CASTLE_RIGHTS.WQ;
			if (move.from === 7) this.castlingMask &= ~CASTLE_RIGHTS.WK;
			if (move.from === 56) this.castlingMask &= ~CASTLE_RIGHTS.BQ;
			if (move.from === 63) this.castlingMask &= ~CASTLE_RIGHTS.BK;
		}

		this.enPassantSquare = nextEnPassantSquare;
		this.sideToMove = enemyColor;
		this.totalNumOfMoves++;
		this.updateOccupancy();
	}

	public clone(): ChessBoard {
		const copy = new ChessBoard(this.pieces);
		copy.sideToMove = this.sideToMove;
		copy.castlingMask = this.castlingMask;
		copy.enPassantSquare = this.enPassantSquare;
		copy.halfMoveClock = this.halfMoveClock;
		copy.totalNumOfMoves = this.totalNumOfMoves;
		return copy;
	}

	private convertMaskToSquares(mask: bigint): number[] {
		const squares: number[] = [];
		let temp = mask;
		while (temp !== 0n) {
			const sq = this.bitScanForward(temp);
			squares.push(Number(sq));
			temp &= temp - 1n; // Clears lowest set bit
		}
		return squares;
	}

	private bitScanForward(mask: bigint): bigint {
		if (mask === 0n) return -1n;
		let count = 0n;
		let temp = mask;
		while ((temp & 1n) === 0n) {
			count++;
			temp >>= 1n;
		}
		return count;
	}
}
