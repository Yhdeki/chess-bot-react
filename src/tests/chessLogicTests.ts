import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { ChessBoard } from "../chessComponents/chessBoard.ts";
import { Piece, Color } from "../chessComponents/types.ts";

// Visual symbols for rendering the board cleanly in the console
const PIECE_SYMBOLS: Record<number, string> = {
	[Color.White * 6 + Piece.Pawn]: "♙",
	[Color.White * 6 + Piece.Knight]: "♘",
	[Color.White * 6 + Piece.Bishop]: "♗",
	[Color.White * 6 + Piece.Rook]: "♖",
	[Color.White * 6 + Piece.Queen]: "♕",
	[Color.White * 6 + Piece.King]: "♔",
	[Color.Black * 6 + Piece.Pawn]: "♟",
	[Color.Black * 6 + Piece.Knight]: "♞",
	[Color.Black * 6 + Piece.Bishop]: "♝",
	[Color.Black * 6 + Piece.Rook]: "♜",
	[Color.Black * 6 + Piece.Queen]: "♛",
	[Color.Black * 6 + Piece.King]: "♚",
};

// Converts coordinates like "e2" to square index (0-63)
function algebraicToSquare(coord: string): number {
	if (coord.length !== 2) return -1;
	const file = coord.charCodeAt(0) - 97; // 'a' is 97
	const rank = coord.charCodeAt(1) - 49; // '1' is 49
	if (file < 0 || file > 7 || rank < 0 || rank > 7) return -1;
	return rank * 8 + file;
}

// Converts square index (0-63) back to coordinate like "e2"
function squareToAlgebraic(square: number): string {
	const file = String.fromCharCode((square % 8) + 97);
	const rank = Math.floor(square / 8) + 1;
	return `${file}${rank}`;
}

// Renders the 64-bit bitboard state into a standard text grid
function renderBoard(board: ChessBoard) {
	console.clear();
	console.log("\n    a  b  c  d  e  f  g  h");
	console.log("  +------------------------+");

	// Loop from rank 8 (top) down to rank 1 (bottom)
	for (let rank = 7; rank >= 0; rank--) {
		let rowStr = `${rank + 1} |`;
		for (let file = 0; file < 8; file++) {
			const squareIndex = rank * 8 + file;
			const pieceInfo = board.getPieceAtSquare(squareIndex);

			if (pieceInfo) {
				const mapIdx = pieceInfo.color * 6 + pieceInfo.pieceType;
				rowStr += ` ${PIECE_SYMBOLS[mapIdx]} `;
			} else {
				// Alternating checkered dot styles for empty tiles
				rowStr += (rank + file) % 2 === 0 ? " . " : "   ";
			}
		}
		rowStr += `| ${rank + 1}`;
		console.log(rowStr);
	}
	console.log("  +------------------------+");
	console.log("    a  b  c  d  e  f  g  h\n");
}

async function runGameLoop() {
	const board = new ChessBoard();
	const rl = readline.createInterface({ input, output });

	console.log("Welcome to TypeScript Bitboard Chess!");
	console.log(
		"Enter moves using standard UCI notation (e.g., 'e2e4', 'g1f3').",
	);
	console.log("Press Enter to begin...");
	await rl.question("");

	while (true) {
		renderBoard(board);

		// Check if game reached terminal state
		const gameEndStatus = board.didGameEnd();
		if (gameEndStatus !== null) {
			if (gameEndStatus === 0) {
				console.log(
					"Game Over! Draw by Stalemate / Insufficient Material.",
				);
			} else if (gameEndStatus > 0) {
				console.log("Game Over! White wins by Checkmate.");
			} else {
				console.log("Game Over! Black wins by Checkmate.");
			}
			break;
		}

		const activePlayerColor =
			board.sideToMove === Color.White ? "White" : "Black";
		const isCurrentlyChecked = board.isChecked(board.sideToMove)
			? " (IN CHECK!)"
			: "";

		const inputMove = await rl.question(
			`${activePlayerColor} to move${isCurrentlyChecked}: `,
		);

		if (
			inputMove.toLowerCase() === "exit" ||
			inputMove.toLowerCase() === "quit"
		) {
			console.log("Game abandoned.");
			break;
		}

		if (inputMove.length !== 4) {
			console.log(
				"Invalid format. Use 4 characters like 'e2e4'. Press Enter to try again.",
			);
			await rl.question("");
			continue;
		}

		const fromSquare = algebraicToSquare(inputMove.substring(0, 2));
		const toSquare = algebraicToSquare(inputMove.substring(2, 4));

		if (fromSquare === -1 || toSquare === -1) {
			console.log(
				"Invalid square coordinates. Press Enter to try again.",
			);
			await rl.question("");
			continue;
		}

		const pieceAtSource = board.getPieceAtSquare(fromSquare);
		if (!pieceAtSource || pieceAtSource.color !== board.sideToMove) {
			console.log(
				`There is no ${activePlayerColor} piece on that square! Press Enter.`,
			);
			await rl.question("");
			continue;
		}

		// Verify move against your engine's bitmask move validator
		const validDestinations = board.getLegalMoves(fromSquare);
		if (!validDestinations.includes(toSquare)) {
			console.log(
				"Illegal move! That destination violates chess rules or leaves your King exposed.",
			);
			console.log(
				`Legal destinations from here: ${validDestinations.map(squareToAlgebraic).join(", ") || "None"}`,
			);
			console.log("Press Enter to try again.");
			await rl.question("");
			continue;
		}

		// Apply state shift directly into bitboard mapping arrays
		board.movePiece(
			{ from: fromSquare, to: toSquare },
			pieceAtSource.pieceType,
			pieceAtSource.color,
		);
	}

	rl.close();
}

// Fire execution loop
runGameLoop().catch((err) =>
	console.error("Runtime error during engine test:", err),
);
