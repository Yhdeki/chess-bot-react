// uciUtils.ts
// Pure, dependency-free move-format conversion — safe to import from BOTH
// the browser (engine.ts) and Node (server/importBook.ts). This is exactly
// why it's split out of parsePgn.ts: that file does `new Database(...)` at
// module load time, so anything importing it (even just for these two
// functions) pulled better-sqlite3 into the browser bundle.
import { PieceType, type ChessMove } from "../types.ts";

export function moveToUci(move: ChessMove): string {
	const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const fromFile = files[move.from % 8];
	const fromRank = Math.floor(move.from / 8) + 1;
	const toFile = files[move.to % 8];
	const toRank = Math.floor(move.to / 8) + 1;

	// BUGFIX: standard UCI notation uses a lowercase promotion letter
	// (e.g. "e7e8q"), and uciToMove() below only ever checks for lowercase.
	// The original wrote uppercase here, so any promotion move written to
	// the book via moveToUci() silently lost its promotion when read back
	// via uciToMove() — confirmed with a round-trip test before fixing.
	let promotionChar = "";
	if (move.promotion === PieceType.Queen) promotionChar = "q";
	else if (move.promotion === PieceType.Rook) promotionChar = "r";
	else if (move.promotion === PieceType.Bishop) promotionChar = "b";
	else if (move.promotion === PieceType.Knight) promotionChar = "n";

	return `${fromFile}${fromRank}${toFile}${toRank}${promotionChar}`;
}

export function uciToMove(uci: string): ChessMove {
	const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const fromFile = files.indexOf(uci[0]);
	const fromRank = parseInt(uci[1]) - 1;
	const toFile = files.indexOf(uci[2]);
	const toRank = parseInt(uci[3]) - 1;

	const move: ChessMove = {
		from: fromRank * 8 + fromFile,
		to: toRank * 8 + toFile,
	};

	if (uci.length === 5) {
		const p = uci[4];
		if (p === "q") move.promotion = PieceType.Queen;
		if (p === "r") move.promotion = PieceType.Rook;
		if (p === "b") move.promotion = PieceType.Bishop;
		if (p === "n") move.promotion = PieceType.Knight;
	}

	return move;
}
