export class ChessBoard {
	// 64-bit bitboard where bit 0 corresponds to square a1 and bit 63 corresponds to square h8.
	chessBoard: bigint;

	// Bitboards for every piece type and color
	whitePawnsBoard: bigint;
	blackPawnsBoard: bigint;
	whiteKnightsBoard: bigint;
	blackKnightsBoard: bigint;
	whiteBishopsBoard: bigint;
	blackBishopsBoard: bigint;
	whiteRooksBoard: bigint;
	blackRooksBoard: bigint;
	whiteQueensBoard: bigint;
	blackQueensBoard: bigint;
	whiteKingsBoard: bigint;
	blackKingsBoard: bigint;

	constructor() {
		// Initialize all the bitboards
		this.whitePawnsBoard = 0x000000000000ff00n;
		this.blackPawnsBoard = 0x00ff000000000000n;
		this.whiteKnightsBoard = 0x0000000000000042n;
		this.blackKnightsBoard = 0x4200000000000000n;
		this.whiteBishopsBoard = 0x0000000000000024n;
		this.blackBishopsBoard = 0x2400000000000000n;
		this.whiteRooksBoard = 0x0000000000000081n;
		this.blackRooksBoard = 0x8100000000000000n;
		this.whiteQueensBoard = 0x0000000000000008n;
		this.blackQueensBoard = 0x0800000000000000n;
		this.whiteKingsBoard = 0x0000000000000010n;
		this.blackKingsBoard = 0x1000000000000000n;
		// The code above is not accurate
		this.chessBoard = this.setUpBoard();
	}

	/**
	 * Constructs the initial board occupancy bitboard.
	 * Combines separate piece bitboards into a single efficient 64-bit representation.
	 */
	setUpBoard(): bigint {
		return (
			this.whitePawnsBoard |
			this.blackPawnsBoard |
			this.whiteKnightsBoard |
			this.blackKnightsBoard |
			this.whiteBishopsBoard |
			this.blackBishopsBoard |
			this.whiteRooksBoard |
			this.blackRooksBoard |
			this.whiteQueensBoard |
			this.blackQueensBoard |
			this.whiteKingsBoard |
			this.blackKingsBoard
		);
	}
	getPieceAtSquare(squareIndex: number): string | null {
		const mask = 1n << BigInt(squareIndex);

		if (((this.whitePawnsBoard | this.blackPawnsBoard) & mask) !== 0n)
			return "pawn";
		if ((this.whiteKnightsBoard | (this.blackKnightsBoard & mask)) !== 0n)
			return "knight";
		if ((this.whiteBishopsBoard | (this.blackBishopsBoard & mask)) !== 0n)
			return "bishop";
		if ((this.whiteRooksBoard | (this.blackRooksBoard & mask)) !== 0n)
			return "rook";
		if ((this.whiteQueensBoard | (this.blackQueensBoard & mask)) !== 0n)
			return "queen";
		if ((this.whiteKingsBoard | (this.blackKingsBoard & mask)) !== 0n)
			return "king";
		return null;
	}
}
