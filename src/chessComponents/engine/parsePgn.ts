import { readFileSync } from "fs";
import Database from "better-sqlite3";
import { ChessBoard } from "../chessBoard.ts";
import { Piece, Color, type ChessMove } from "../types.ts";

// =========================================================================
// 1. DATABASE INITIALIZATION (Matches mega_opening_book.db expected by engine)
// =========================================================================
const db = new Database("mega_opening_book.db");

// Optimize SQLite for high-speed batch writes
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
// 2. MOVE FORMAT CONVERSION UTILITIES (Imported directly by engine.ts)
// =========================================================================
export function moveToUci(move: ChessMove): string {
	const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
	const fromFile = files[move.from % 8];
	const fromRank = Math.floor(move.from / 8) + 1;
	const toFile = files[move.to % 8];
	const toRank = Math.floor(move.to / 8) + 1;

	let promotionChar = "=";
	if (move.promotion === Piece.Queen) promotionChar = "Q";
	else if (move.promotion === Piece.Rook) promotionChar = "R";
	else if (move.promotion === Piece.Bishop) promotionChar = "B";
	else if (move.promotion === Piece.Knight) promotionChar = "N";
	else promotionChar = "";
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
		if (p === "q") move.promotion = Piece.Queen;
		if (p === "r") move.promotion = Piece.Rook;
		if (p === "b") move.promotion = Piece.Bishop;
		if (p === "n") move.promotion = Piece.Knight;
	}

	return move;
}

// =========================================================================
// 3. SAN (Standard Algebraic Notation) TO INTERNAL COORDINATES TRANSLATOR
// =========================================================================
function parseSanMove(san: string, board: ChessBoard): ChessMove | null {
	// Clean trailing checks or checkmates
	const cleanSan = san.replace(/[+#?]/g, "");

	// Handle Castling
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

	// Determine target square coordinates
	let targetStr = cleanSan.slice(-2);
	let promotionPiece: Piece | undefined;

	// Check for Pawn Promotion (e.g., e8=Q)
	if (cleanSan.includes("=")) {
		const parts = cleanSan.split("=");
		targetStr = parts[0].slice(-2);
		const pChar = parts[1][0];
		if (pChar === "Q") promotionPiece = Piece.Queen;
		if (pChar === "R") promotionPiece = Piece.Rook;
		if (pChar === "B") promotionPiece = Piece.Bishop;
		if (pChar === "N") promotionPiece = Piece.Knight;
	}

	const targetFile = targetStr.charCodeAt(0) - 97; // 'a' -> 0
	const targetRank = parseInt(targetStr[1]) - 1; // '1' -> 0
	const targetSq = targetRank * 8 + targetFile;

	// Determine piece type
	let expectedType: Piece = Piece.Pawn;
	let lookForPiece = cleanSan[0];
	let disambiguation = "";

	if (["N", "B", "R", "Q", "K"].includes(lookForPiece)) {
		if (lookForPiece === "N") expectedType = Piece.Knight;
		if (lookForPiece === "B") expectedType = Piece.Bishop;
		if (lookForPiece === "R") expectedType = Piece.Rook;
		if (lookForPiece === "Q") expectedType = Piece.Queen;
		if (lookForPiece === "K") expectedType = Piece.King;

		// Everything between piece identification symbol and target coordinates
		disambiguation = cleanSan
			.slice(1, cleanSan.includes("=") ? cleanSan.indexOf("=") - 2 : -2)
			.replace("x", "");
	} else {
		// Pawn moves can include a starting file indicator (e.g., exd5)
		if (cleanSan.includes("x")) {
			disambiguation = cleanSan.split("x")[0];
		}
	}

	// Find the matching square using engine pseudo-legal validation rules
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
			// Apply disambiguation check rules (like file or rank identification matches)
			if (disambiguation.length === 1) {
				const charCode = disambiguation.charCodeAt(0);
				if (charCode >= 97 && charCode <= 104) {
					// It's a file letter (a-h)
					if (sq % 8 !== charCode - 97) continue;
				} else {
					// It's a rank number (1-8)
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
// 4. MAIN PIPELINE EXECUTION
// =========================================================================
export function convertToDb(filePath: string) {
	console.log("Reading PGN archive...");
	const content = readFileSync(filePath, "utf-8");

	// Split into arrays of text groupings using raw whitespace boundary markers
	const blocks = content.split(/\n\s*\n/);
	let gameCount = 0;

	console.log("Compiling lines into mega database...");

	// Use an atomic transaction wrapper to perform batch speed updates
	const runTransaction = db.transaction(() => {
		for (const block of blocks) {
			if (!block.trim() || block.trim().startsWith("[")) {
				continue; // Skip lines containing purely match tags metadata
			}

			// Strip metadata annotations, line number dots, and outcome tags
			const cleanedMoves = block
				.replace(/\{[^}]*\}/g, "") // Remove variations/comments
				.replace(/\d+\.+\s*/g, "") // Remove line identifiers "1.", "2..."
				.replace(/(1-0|0-1|1\/2-1\/2)/g, "") // Remove status labels
				.replace(/\s+/g, " ") // Standardize spacings
				.trim();

			if (!cleanedMoves) continue;

			const sanMoves = cleanedMoves.split(" ");
			const board = new ChessBoard();
			const historyUci: string[] = [];

			for (const san of sanMoves) {
				if (!san) continue;

				const move = parseSanMove(san, board);
				if (!move) break; // If a move structure fails to parse, drop out safely

				const uciMoveString = moveToUci(move);
				const currentHistoryString = historyUci.join(" ");

				// Write the history string and the response move choice right into our database
				upsertStmt.run(currentHistoryString, uciMoveString);

				// Advance internal state structures forward to prepare for the next turn loop step
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

// Run the script conversion tool locally
// try {
// 	convertToDb("./src/chessComponents/engine/Carlsen.pgn");
// } catch (err) {
// 	console.error("Critical execution breakdown: ", err);
// }
