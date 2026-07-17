import {
	getKnightAttacks,
	getKingAttacks,
	getRookAttacks,
	getBishopAttacks,
	getQueenAttacks,
} from "./precomputedMoves.ts";
import {
	PieceType,
	Color,
	CASTLE_RIGHTS,
	type ChessMove,
	getPieceNameByType,
	type ChessPiece,
} from "./types.ts";

const sqToBB = (sq: number): bigint => 1n << BigInt(sq);
const SIDE_LEN = 8;
export class ChessBoard {
	public pieces: bigint[] = new Array(12).fill(0n);
	public colors: bigint[] = new Array(2).fill(0n);
	public combinedOccupancy: bigint = 0n;

	public sideToMove: Color = Color.White;
	public castlingMask: number = 0b1111;
	public enPassantSquare: number | null = null;
	public halfMoveClock: number = 0;
	public totalNumOfMoves: number = 0;
	public moveHistory: ChessMove[] = []; // Track move history for opening book lookups
	public capturedPieces: ChessPiece[] = [];

	public mailbox: Array<ChessPiece | null> = [];
	constructor(
		customPieces?: bigint[],
		customMailbox?: Array<ChessPiece | null>,
	) {
		if (customPieces && customPieces.length === 12 && customMailbox) {
			this.pieces = [...customPieces];
			this.mailbox = [...customMailbox];
			this.updateOccupancy();
		} else {
			this.initializeDefaultBoard();
		}
	}

	private initializeDefaultBoard() {
		this.pieces[Color.White * 6 + PieceType.Pawn] = 0x000000000000ff00n;
		this.pieces[Color.Black * 6 + PieceType.Pawn] = 0x00ff000000000000n;
		this.pieces[Color.White * 6 + PieceType.Knight] = 0x0000000000000042n;
		this.pieces[Color.Black * 6 + PieceType.Knight] = 0x4200000000000000n;
		this.pieces[Color.White * 6 + PieceType.Bishop] = 0x0000000000000024n;
		this.pieces[Color.Black * 6 + PieceType.Bishop] = 0x2400000000000000n;
		this.pieces[Color.White * 6 + PieceType.Rook] = 0x0000000000000081n;
		this.pieces[Color.Black * 6 + PieceType.Rook] = 0x8100000000000000n;
		this.pieces[Color.White * 6 + PieceType.Queen] = 0x0000000000000008n;
		this.pieces[Color.Black * 6 + PieceType.Queen] = 0x0800000000000000n;
		this.pieces[Color.White * 6 + PieceType.King] = 0x0000000000000010n;
		this.pieces[Color.Black * 6 + PieceType.King] = 0x1000000000000000n;

		// Creating a board for easier access to a piece at a certain square
		[
			{ pieceType: PieceType.Rook, color: Color.White },
			{ pieceType: PieceType.Knight, color: Color.White },
			{ pieceType: PieceType.Bishop, color: Color.White },
			{ pieceType: PieceType.Queen, color: Color.White },
			{ pieceType: PieceType.King, color: Color.White },
			{ pieceType: PieceType.Bishop, color: Color.White },
			{ pieceType: PieceType.Knight, color: Color.White },
			{ pieceType: PieceType.Rook, color: Color.White },
		].forEach((element) => {
			this.mailbox.push(element);
		});
		for (let i = 0; i < SIDE_LEN; i++) {
			this.mailbox.push({
				pieceType: PieceType.Pawn,
				color: Color.White,
			});
		}
		for (let i = 0; i < SIDE_LEN * 4; i++) {
			this.mailbox.push(null);
		}
		for (let i = 0; i < SIDE_LEN; i++) {
			this.mailbox.push({
				pieceType: PieceType.Pawn,
				color: Color.Black,
			});
		}
		[
			{ pieceType: PieceType.Rook, color: Color.Black },
			{ pieceType: PieceType.Knight, color: Color.Black },
			{ pieceType: PieceType.Bishop, color: Color.Black },
			{ pieceType: PieceType.Queen, color: Color.Black },
			{ pieceType: PieceType.King, color: Color.Black },
			{ pieceType: PieceType.Bishop, color: Color.Black },
			{ pieceType: PieceType.Knight, color: Color.Black },
			{ pieceType: PieceType.Rook, color: Color.Black },
		].forEach((element) => {
			this.mailbox?.push(element);
		});
		this.updateOccupancy();
	}

	public updateOccupancy() {
		this.colors[Color.White] =
			this.pieces[0] |
			this.pieces[1] |
			this.pieces[2] |
			this.pieces[3] |
			this.pieces[4] |
			this.pieces[5];

		this.colors[Color.Black] =
			this.pieces[6] |
			this.pieces[7] |
			this.pieces[8] |
			this.pieces[9] |
			this.pieces[10] |
			this.pieces[11];

		this.combinedOccupancy =
			this.colors[Color.White] | this.colors[Color.Black];
	}

	public getPieceAtSquare(square: number): ChessPiece | null {
		return this.mailbox[square];
	}
	public getPieceNameAtSquare(square: number): string | null {
		const pieceInfo = this.getPieceAtSquare(square);
		if (pieceInfo === null) {
			return null;
		}
		return pieceInfo.color === Color.White
			? "white "
			: "black " + getPieceNameByType(pieceInfo.pieceType);
	}

	public isSquareAttacked(square: number, byColor: Color): boolean {
		const occ = this.combinedOccupancy;

		// Check Slider Attacks from the objective square out
		if (
			(getBishopAttacks(square, occ) &
				(this.pieces[byColor * 6 + PieceType.Bishop] |
					this.pieces[byColor * 6 + PieceType.Queen])) !==
			0n
		)
			return true;
		if (
			(getRookAttacks(square, occ) &
				(this.pieces[byColor * 6 + PieceType.Rook] |
					this.pieces[byColor * 6 + PieceType.Queen])) !==
			0n
		)
			return true;
		if (
			(getKnightAttacks(square) &
				this.pieces[byColor * 6 + PieceType.Knight]) !==
			0n
		)
			return true;
		if (
			(getKingAttacks(square) &
				this.pieces[byColor * 6 + PieceType.King]) !==
			0n
		)
			return true;

		// Pawns
		const pawns = this.pieces[byColor * 6 + PieceType.Pawn];
		const sqMask = sqToBB(square);
		if (byColor === Color.White) {
			// White pawns attacking black from down-left / down-right
			if (((sqMask >> 7n) & pawns & 0xfefefefefefefefen) !== 0n)
				return true;
			if (((sqMask >> 9n) & pawns & 0x7f7f7f7f7f7f7f7fn) !== 0n)
				return true;
		} else {
			// Black pawns attacking white from up-left / up-right
			if (((sqMask << 7n) & pawns & 0x7f7f7f7f7f7f7f7fn) !== 0n)
				return true;
			if (((sqMask << 9n) & pawns & 0xfefefefefefefefen) !== 0n)
				return true;
		}

		return false;
	}

	public isChecked(color: Color): boolean {
		const kingBB = this.pieces[color * 6 + PieceType.King];
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
			case PieceType.Knight:
				movesMask = getKnightAttacks(square) & ~ownPieces;
				break;
			case PieceType.King:
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
			case PieceType.Bishop:
				movesMask = getBishopAttacks(square, occ) & ~ownPieces;
				break;
			case PieceType.Rook:
				movesMask = getRookAttacks(square, occ) & ~ownPieces;
				break;
			case PieceType.Queen:
				movesMask = getQueenAttacks(square, occ) & ~ownPieces;
				break;
			case PieceType.Pawn: {
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
				{ from: square, to: to },
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

	public movePiece(
		move: ChessMove,
		pieceType: PieceType,
		color: Color,
	): void {
		const fromMask = sqToBB(move.from);
		const toMask = sqToBB(move.to);
		const pIdx = color * 6 + pieceType;
		const enemyColor = color === Color.White ? Color.Black : Color.White;

		// Reset En Passant Target status
		let nextEnPassantSquare: number | null = null;

		// Handle Castling Execution
		if (
			pieceType === PieceType.King &&
			Math.abs(move.to - move.from) === 2
		) {
			if (move.to === 6) {
				// WK
				this.pieces[Color.White * 6 + PieceType.Rook] ^=
					sqToBB(7) | sqToBB(5);
				// Update the board
				this.mailbox[4] = null;
				this.mailbox[6] = {
					pieceType: PieceType.King,
					color: Color.White,
				};
				this.mailbox[7] = null;
				this.mailbox[5] = {
					pieceType: PieceType.Rook,
					color: Color.White,
				};
			} else if (move.to === 2) {
				// WQ
				this.pieces[Color.White * 6 + PieceType.Rook] ^=
					sqToBB(0) | sqToBB(3);

				this.mailbox[4] = null;
				this.mailbox[2] = {
					pieceType: PieceType.King,
					color: Color.White,
				};
				this.mailbox[0] = null;
				this.mailbox[3] = {
					pieceType: PieceType.Rook,
					color: Color.White,
				};
			} else if (move.to === 62) {
				// BK
				this.pieces[Color.Black * 6 + PieceType.Rook] ^=
					sqToBB(63) | sqToBB(61);

				this.mailbox[60] = null;
				this.mailbox[62] = {
					pieceType: PieceType.King,
					color: Color.Black,
				};
				this.mailbox[63] = null;
				this.mailbox[61] = {
					pieceType: PieceType.Rook,
					color: Color.Black,
				};
			} else if (move.to === 58) {
				// BQ
				this.pieces[Color.Black * 6 + PieceType.Rook] ^=
					sqToBB(56) | sqToBB(59);

				this.mailbox[60] = null;
				this.mailbox[58] = {
					pieceType: PieceType.King,
					color: Color.Black,
				};
				this.mailbox[56] = null;
				this.mailbox[59] = {
					pieceType: PieceType.Rook,
					color: Color.Black,
				};
			}
		}

		// Handle En Passant Capture Logic
		if (pieceType === PieceType.Pawn && move.to === this.enPassantSquare) {
			const epCaptureSq =
				color === Color.White ? move.to - SIDE_LEN : move.to + SIDE_LEN;
			this.pieces[enemyColor * 6 + PieceType.Pawn] &=
				~sqToBB(epCaptureSq);

			this.mailbox[move.from] = null;
			this.mailbox[move.to] = { pieceType: pieceType, color: color };

			this.mailbox[epCaptureSq] = null;

			this.capturedPieces.push({
				pieceType: PieceType.Pawn,
				color: enemyColor,
			});
		}

		// Handle Standard Captures
		if ((toMask & this.combinedOccupancy) !== 0n) {
			for (let i = enemyColor * 6; i < enemyColor * 6 + 6; i++) {
				if ((this.pieces[i] & toMask) !== 0n) {
					this.pieces[i] &= ~toMask;
					this.capturedPieces.push({
						pieceType: (i - enemyColor * 6) as PieceType,
						color: enemyColor,
					});
					break;
				}
			}
		}

		// Update Moving Piece Location
		this.pieces[pIdx] &= ~fromMask;
		this.pieces[pIdx] |= toMask;

		this.mailbox[move.from] = null;
		this.mailbox[move.to] = { pieceType: pieceType, color: color };

		// Handle Pawn Double Steps (Setting up new EP targets)
		if (
			pieceType === PieceType.Pawn &&
			Math.abs(move.to - move.from) === 16
		) {
			nextEnPassantSquare =
				color === Color.White ? move.from + 8 : move.from - 8;
		}

		// Handle Pawn Promotions
		if (
			pieceType === PieceType.Pawn &&
			(Math.floor(move.to / 8) === 7 || Math.floor(move.to / 8) === 0)
		) {
			this.pieces[pIdx] &= ~toMask;
			const promoPiece =
				move.promotion !== undefined ? move.promotion : PieceType.Queen;
			this.pieces[color * 6 + promoPiece] |= toMask;
			this.mailbox[move.to] = { pieceType: promoPiece, color: color };
		}

		// Dynamic Castling Rights Revocation
		if (pieceType === PieceType.King) {
			this.castlingMask &= color === Color.White ? ~3 : ~12;
		} else if (pieceType === PieceType.Rook) {
			if (move.from === 0) this.castlingMask &= ~CASTLE_RIGHTS.WQ;
			if (move.from === 7) this.castlingMask &= ~CASTLE_RIGHTS.WK;
			if (move.from === 56) this.castlingMask &= ~CASTLE_RIGHTS.BQ;
			if (move.from === 63) this.castlingMask &= ~CASTLE_RIGHTS.BK;
		}

		this.enPassantSquare = nextEnPassantSquare;
		this.sideToMove = enemyColor;
		this.totalNumOfMoves++;
		this.moveHistory.push({ ...move }); // Record move to persistent tracking
		this.updateOccupancy();
	}

	public didGameEnd(): number | null {
		// Check if the current player has any legal moves available
		let hasLegalMoves = false;
		for (let sq = 0; sq < 64; sq++) {
			const p = this.getPieceAtSquare(sq);
			if (p && p.color === this.sideToMove) {
				if (this.getLegalMoves(sq).length > 0) {
					hasLegalMoves = true;
					break;
				}
			}
		}

		if (!hasLegalMoves) {
			// If no legal moves and king is attacked, it's checkmate
			if (this.isChecked(this.sideToMove)) {
				return 1;
			}
			// No legal moves and king is safe means stalemate
			return 0;
		}

		return null; // Game continues
	}

	public clone(): ChessBoard {
		const copy = new ChessBoard(this.pieces);
		copy.sideToMove = this.sideToMove;
		copy.castlingMask = this.castlingMask;
		copy.enPassantSquare = this.enPassantSquare;
		copy.halfMoveClock = this.halfMoveClock;
		copy.totalNumOfMoves = this.totalNumOfMoves;
		copy.moveHistory = this.moveHistory.map((m) => ({ ...m })); // Maintain move history clone
		copy.capturedPieces = this.capturedPieces.map((p) => ({ ...p }));
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
