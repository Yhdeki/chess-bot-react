type Bitboard = bigint;

// Static lookup tables initialized ONCE on application boot
const knightAttacks: Bitboard[] = new Array(64).fill(0n);
const kingAttacks: Bitboard[] = new Array(64).fill(0n);
const rayAttacks: Bitboard[][] = Array.from({ length: 64 }, () =>
	new Array(8).fill(0n),
);

// Direction deltas for sliding piece raycasting
const DIRECTIONS = [8, -8, 1, -1, 9, -9, 7, -7];

function initPrecomputedTables() {
	for (let sq = 0; sq < 64; sq++) {
		const file = sq % 8;
		const rank = Math.floor(sq / 8);
		const bb = 1n << BigInt(sq);

		// 1. Precompute Knights
		const knightOffsets = [17, 15, 10, 6, -6, -10, -15, -17];
		const knightMasks = [
			0x7f7f7f7f7f7f7f7fn,
			0xfefefefefefefefen,
			0x3f3f3f3f3f3f3f3fn,
			0xfcfcfcfcfcfcfcfcn,
			0x3f3f3f3f3f3f3f3fn,
			0xfcfcfcfcfcfcfcfcn,
			0x7f7f7f7f7f7f7f7fn,
			0xfefefefefefefefen,
		];
		for (let i = 0; i < 8; i++) {
			const shift = BigInt(knightOffsets[i]);
			const target =
				shift > 0n
					? bb << shift
					: bb >> BigInt(Math.abs(Number(shift)));
			if (target > 0n && target <= 0xffffffffffffffffn) {
				knightAttacks[sq] |= target & knightMasks[i];
			}
		}

		// 2. Precompute Kings
		const kingOffsets = [9, 8, 7, 1, -1, -7, -8, -9];
		for (const offset of kingOffsets) {
			const targetSq = sq + offset;
			if (
				targetSq >= 0 &&
				targetSq < 64 &&
				Math.abs((targetSq % 8) - file) <= 1
			) {
				kingAttacks[sq] |= 1n << BigInt(targetSq);
			}
		}

		// 3. Precompute Sliding Rays (Fallback for complex Magic Tables initialization)
		for (let d = 0; d < 8; d++) {
			let currentSq = sq;
			const delta = DIRECTIONS[d];
			while (true) {
				const nextSq = currentSq + delta;
				if (nextSq < 0 || nextSq > 63) break;
				if (
					d === 2 ||
					d === 3 ||
					d === 4 ||
					d === 5 ||
					d === 6 ||
					d === 7
				) {
					if (Math.abs((nextSq % 8) - (currentSq % 8)) > 1) break;
				}
				rayAttacks[sq][d] |= 1n << BigInt(nextSq);
				currentSq = nextSq;
			}
		}
	}
}

// Run computation automatically on file import
initPrecomputedTables();

export function getKnightAttacks(square: number): Bitboard {
	return knightAttacks[square];
}

export function getKingAttacks(square: number): Bitboard {
	return kingAttacks[square];
}

export function getRookAttacks(square: number, occupancy: Bitboard): Bitboard {
	let attacks = 0n;
	for (let d = 0; d < 4; d++) {
		// First 4 directions are orthogonal
		attacks |= getRayAttacksInDirection(square, d, occupancy);
	}
	return attacks;
}

export function getBishopAttacks(
	square: number,
	occupancy: Bitboard,
): Bitboard {
	let attacks = 0n;
	for (let d = 4; d < 8; d++) {
		// Last 4 directions are diagonal
		attacks |= getRayAttacksInDirection(square, d, occupancy);
	}
	return attacks;
}

export function getQueenAttacks(square: number, occupancy: Bitboard): Bitboard {
	return (
		getRookAttacks(square, occupancy) | getBishopAttacks(square, occupancy)
	);
}

function getRayAttacksInDirection(
	square: number,
	directionIdx: number,
	occupancy: Bitboard,
): Bitboard {
	let attacks = rayAttacks[square][directionIdx];
	const blockers = attacks & occupancy;
	if (blockers !== 0n) {
		// Find closest blocking square in this specific ray direction
		const delta = DIRECTIONS[directionIdx];
		let scanSq = square + delta;
		let dynamicAttacks = 0n;
		while (scanSq >= 0 && scanSq < 64) {
			const bit = 1n << BigInt(scanSq);
			dynamicAttacks |= bit;
			if ((bit & occupancy) !== 0n) break; // Hit a blocking piece
			if ((bit & attacks) === 0n) break; // Exited precomputed boundary
			scanSq += delta;
		}
		return dynamicAttacks;
	}
	return attacks;
}
