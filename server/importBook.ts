// server/importBook.ts
//
// One-time (or occasional) build step: reads a PGN file from disk and
// upserts (history_string -> chosen_move) rows into mega_opening_book.db.
// This is Node-only code — run it directly, e.g.:
//
//   npx tsx server/importBook.ts ./Carlsen.pgn
//
// It is NOT imported by anything in src/ — that's what caused the original
// "fs.readFileSync is not a function" / better-sqlite3-in-the-browser error.
//
// NOTE ON PATHS: I don't have your real folder layout, so the two imports
// below assume src/chessComponents/{chessBoard.ts,types.ts} relative to a
// server/ folder at your project root. Adjust if your structure differs.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { ChessBoard } from "../src/chessComponents/chessBoard";
import { Color, PieceType, type ChessMove } from "../src/chessComponents/types";
import { moveToUci } from "../src/chessComponents/engine/uciUtils";

const DB_PATH = path.resolve(process.cwd(), "mega_opening_book.db");

const db = new Database(DB_PATH);
db.exec("PRAGMA synchronous = OFF; PRAGMA journal_mode = MEMORY;");
db.exec(`
  CREATE TABLE IF NOT EXISTS openings (
    history_string TEXT,
    chosen_move TEXT,
    weight INTEGER DEFAULT 1,
    PRIMARY KEY (history_string, chosen_move)
  );
`);

const upsertStmt = db.prepare(`
  INSERT INTO openings (history_string, chosen_move, weight)
  VALUES (?, ?, 1)
  ON CONFLICT(history_string, chosen_move)
  DO UPDATE SET weight = weight + 1
`);

// =========================================================================
// SAN -> internal coordinates translator (unchanged from your original)
// =========================================================================
function parseSanMove(san: string, board: ChessBoard): ChessMove | null {
	const cleanSan = san.replace(/[+#?]/g, "");

	if (cleanSan === "O-O" || cleanSan === "0-0") {
		return board.sideToMove === Color.White
			? { from: 4, to: 6 }
			: { from: 60, to: 62 };
	}
	if (cleanSan === "O-O-O" || cleanSan === "0-0-0") {
		return board.sideToMove === Color.White
			? { from: 4, to: 2 }
			: { from: 60, to: 58 };
	}

	let targetStr = cleanSan.slice(-2);
	let promotionPiece: PieceType | undefined;

	if (cleanSan.includes("=")) {
		const parts = cleanSan.split("=");
		targetStr = parts[0].slice(-2);
		const pChar = parts[1][0];
		if (pChar === "Q") promotionPiece = PieceType.Queen;
		if (pChar === "R") promotionPiece = PieceType.Rook;
		if (pChar === "B") promotionPiece = PieceType.Bishop;
		if (pChar === "N") promotionPiece = PieceType.Knight;
	}

	const targetFile = targetStr.charCodeAt(0) - 97;
	const targetRank = parseInt(targetStr[1]) - 1;
	const targetSq = targetRank * 8 + targetFile;

	let expectedType: PieceType = PieceType.Pawn;
	let lookForPiece = cleanSan[0];
	let disambiguation = "";

	if (["N", "B", "R", "Q", "K"].includes(lookForPiece)) {
		if (lookForPiece === "N") expectedType = PieceType.Knight;
		if (lookForPiece === "B") expectedType = PieceType.Bishop;
		if (lookForPiece === "R") expectedType = PieceType.Rook;
		if (lookForPiece === "Q") expectedType = PieceType.Queen;
		if (lookForPiece === "K") expectedType = PieceType.King;

		disambiguation = cleanSan
			.slice(1, cleanSan.includes("=") ? cleanSan.indexOf("=") - 2 : -2)
			.replace("x", "");
	} else {
		if (cleanSan.includes("x")) {
			disambiguation = cleanSan.split("x")[0];
		}
	}

	for (let sq = 0; sq < 64; sq++) {
		const piece = board.getPieceAtSquare(sq);
		if (
			!piece ||
			piece.color !== board.sideToMove ||
			piece.pieceType !== expectedType
		) {
			continue;
		}

		const pseudoMoves = board.getPseudoLegalMoves(sq);
		if (pseudoMoves.includes(targetSq)) {
			if (disambiguation.length === 1) {
				const charCode = disambiguation.charCodeAt(0);
				if (charCode >= 97 && charCode <= 104) {
					if (sq % 8 !== charCode - 97) continue;
				} else {
					if (Math.floor(sq / 8) !== parseInt(disambiguation) - 1)
						continue;
				}
			}
			return { from: sq, to: targetSq, promotion: promotionPiece };
		}
	}

	return null;
}

// =========================================================================
// Main pipeline
// =========================================================================
export function convertToDb(filePath: string) {
	console.log("Reading PGN archive...");
	// CHANGED: this runs in Node now, so read the file directly rather than
	// fetch()-ing it (fetch() was only ever a workaround for the browser).
	const content = fs.readFileSync(filePath, "utf-8");

	const blocks = content.split(/\n\s*\n/);
	let gameCount = 0;

	console.log("Compiling lines into mega database...");

	const runTransaction = db.transaction(() => {
		for (const block of blocks) {
			if (!block.trim() || block.trim().startsWith("[")) {
				continue;
			}

			const cleanedMoves = block
				.replace(/\{[^}]*\}/g, "")
				.replace(/\d+\.+\s*/g, "")
				.replace(/(1-0|0-1|1\/2-1\/2)/g, "")
				.replace(/\s+/g, " ")
				.trim();

			if (!cleanedMoves) continue;

			const sanMoves = cleanedMoves.split(" ");
			const board = new ChessBoard();
			const historyUci: string[] = [];

			for (const san of sanMoves) {
				if (!san) continue;

				const move = parseSanMove(san, board);
				if (!move) break;

				const uciMoveString = moveToUci(move);
				const currentHistoryString = historyUci.join(" ");

				upsertStmt.run(currentHistoryString, uciMoveString);

				const activePiece = board.getPieceAtSquare(move.from);
				if (activePiece) {
					board.movePiece(
						move,
						activePiece.pieceType,
						activePiece.color,
					);
				}
				historyUci.push(uciMoveString);
			}

			gameCount++;
			if (gameCount % 500 === 0) {
				console.log(
					`Processed ${gameCount} master-level games successfully.`,
				);
			}
		}
	});

	runTransaction();
	console.log(
		`Compilation complete! Opening book loaded with ${gameCount} games.`,
	);
}

// Run directly: `npx tsx server/importBook.ts ./Carlsen.pgn`
const inputFile = process.argv[2];
if (inputFile) {
	try {
		convertToDb(path.resolve(process.cwd(), inputFile));
	} catch (err) {
		console.error("Critical execution breakdown: ", err);
	}
} else {
	console.log("Usage: npx tsx server/importBook.ts <path-to-pgn-file>");
}
