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
		const bb = 1n << BigInt(sq);

		// 1. Precompute Knights
		const knightOffsets = [17, 15, 10, 6, -6, -10, -15, -17];
		// BUGFIX: masks were previously paired with the wrong offsets (each one
		// swapped with its east/west mirror), which let some knight moves wrap
		// around the board edge (e.g. a1 incorrectly "attacked" c2's mirror on
		// the h-file) and dropped other legal ones. Verified against known
		// knight-move squares on corners, edges, and center before/after.
		const knightMasks = [
			0xfefefefefefefefen, // +17 (up2,right1 / noNoEa) -> exclude file A wrap
			0x7f7f7f7f7f7f7f7fn, // +15 (up2,left1  / noNoWe) -> exclude file H wrap
			0xfcfcfcfcfcfcfcfcn, // +10 (up1,right2 / noEaEa) -> exclude files A,B wrap
			0x3f3f3f3f3f3f3f3fn, // +6  (up1,left2  / noWeWe) -> exclude files G,H wrap
			0xfcfcfcfcfcfcfcfcn, // -6  (dn1,right2 / soEaEa) -> exclude files A,B wrap
			0x3f3f3f3f3f3f3f3fn, // -10 (dn1,left2  / soWeWe) -> exclude files G,H wrap
			0xfefefefefefefefen, // -15 (dn2,right1 / soSoEa) -> exclude file A wrap
			0x7f7f7f7f7f7f7f7fn, // -17 (dn2,left1  / soSoWe) -> exclude file H wrap
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
