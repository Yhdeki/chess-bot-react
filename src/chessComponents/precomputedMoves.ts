type Bitboard = bigint;

// Configuration tables for both types of sliding movement
const rookMasks: Bitboard[] = new Array(64).fill(0n);
const bishopMasks: Bitboard[] = new Array(64).fill(0n);

const rookShifts: number[] = new Array(64).fill(0);
const bishopShifts: number[] = new Array(64).fill(0);

const rookMagics: Bitboard[] = new Array(64).fill(0n);
const bishopMagics: Bitboard[] = new Array(64).fill(0n);

// The precomputed database lookup tables
const rookAttacks: Bitboard[][] = Array.from({ length: 64 }, () => []);
const bishopAttacks: Bitboard[][] = Array.from({ length: 64 }, () => []);

/**
 * Calculates legal rook attacks using magic bitboards
 */
export function getRookAttacks(square: number, occupancy: Bitboard): Bitboard {
	return getSlidingPieceAttacks(
		square,
		occupancy,
		rookMasks,
		rookMagics,
		rookShifts,
		rookAttacks,
	);
}

export function getSlidingPieceAttacks(
	square: number,
	occupancy: Bitboard,
	pieceMasks: bigint[],
	pieceMagics: bigint[],
	pieceShift: number[],
	pieceAttacks: Bitboard[][],
): Bitboard {
	const blockers = occupancy & pieceMasks[square];
	const magic = pieceMagics[square];
	const shift = pieceShift[square];

	// Perform perfect hashing formula
	const index = Number((blockers * magic) >> BigInt(shift));
	return pieceAttacks[square][index];
}
/**
 * Calculates legal bishop attacks using magic bitboards
 */
export function getBishopAttacks(
	square: number,
	occupancy: Bitboard,
): Bitboard {
	return getSlidingPieceAttacks(
		square,
		occupancy,
		bishopMasks,
		bishopMagics,
		bishopShifts,
		bishopAttacks,
	);
}

/**
 * Calculates queen attacks by combining rook and bishop lookups
 */
export function getQueenAttacks(square: number, occupancy: Bitboard): Bitboard {
	// A queen's reach is the union of straight and diagonal attacks
	return (
		getRookAttacks(square, occupancy) | getBishopAttacks(square, occupancy)
	);
}

export function precomputeKnights(): bigint[] {
	return Array.from({ length: 64 }, (_, sq) => {
		let attacks = 0n;
		const bb = 1n << BigInt(sq);

		// Helper to safely shift and avoid file wraps
		const addMove = (shift: bigint, mask: bigint) => {
			const shifted =
				shift > 0n
					? bb << shift
					: bb >> BigInt(Math.abs(Number(shift)));
			attacks |= shifted & mask;
		};

		addMove(17n, 0x7f7f7f7f7f7f7f7fn); // Left 1, Up 2
		addMove(15n, 0xfefefefefefefefen); // Right 1, Up 2
		addMove(10n, 0x3f3f3f3f3f3f3f3fn); // Left 2, Up 1
		addMove(6n, 0xfcfcfcfcfcfcfcfcn); // Right 2, Up 1
		addMove(-6n, 0x3f3f3f3f3f3f3f3fn); // Left 2, Down 1
		addMove(-10n, 0xfcfcfcfcfcfcfcfcn); // Right 2, Down 1
		addMove(-15n, 0x7f7f7f7f7f7f7f7fn); // Left 1, Down 2
		addMove(-17n, 0xfefefefefefefefen); // Right 1, Down 2
		return attacks;
	});
}
