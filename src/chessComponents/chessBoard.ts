export class ChessBoard {
	// 64-bit bitboard where bit 0 corresponds to square a1 and bit 63 corresponds to square h8.
	chessBoard: bigint;

	// White pawn occupancy bitboard. Efficient for pawn move generation.
	whitePawns: bigint;

	/**
	 * Black pawn occupancy bitboard. Efficient for pawn move generation.
	 */
	blackPawns: bigint;

	/**
	 * White non-pawn pieces on rank 1.
	 */
	whitePieces: bigint;

	/**
	 * Black non-pawn pieces on rank 8.
	 */
	blackPieces: bigint;

	constructor() {
		this.whitePawns = 0x000000000000ff00n;
		this.blackPawns = 0x00ff000000000000n;
		this.whitePieces = 0x00000000000000ffn;
		this.blackPieces = 0xff00000000000000n;
		this.chessBoard = this.setUpBoard();
	}

	/**
	 * Constructs the initial board occupancy bitboard.
	 * Combines separate piece bitboards into a single efficient 64-bit representation.
	 */
	setUpBoard(): bigint {
		return (
			this.whitePawns |
			this.blackPawns |
			this.whitePieces |
			this.blackPieces
		);
	}
}
