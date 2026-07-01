import { ChessBoard } from "../chessBoard.ts";
import { Piece, Color, type ChessMove } from "../types.ts";
import * as readline from "readline";
import { moveToUci, uciToMove } from "./parsePgn.ts";

import Database from "better-sqlite3";

const db = new Database("mega_opening_book.db");

/**
 * Queries a massive local database for the best move based on history.
 * This keeps memory usage near 0 MB regardless of how large the book is.
 */
export function getMassiveBookMove(moveHistory: ChessMove[]): ChessMove | null {
	// 1. Convert history array to a single string identifier
	const uciHistoryString = moveHistory.map(moveToUci).join(" ");

	// 2. Query the database for moves matching this exact line
	// We select the moves and order them by weight/popularity among grandmasters
	const query = db.prepare(`
        SELECT chosen_move, weight 
        FROM openings 
        WHERE history_string = ? 
        ORDER BY weight DESC 
        LIMIT 5
    `);

	const potentialMoves = query.all(uciHistoryString) as {
		chosen_move: string;
		weight: number;
	}[];

	if (potentialMoves.length === 0) {
		return null; // Book out of bounds -> switch to engine calculation
	}

	// 3. Weighted random selection so your engine doesn't play the exact same game every time
	const totalWeight = potentialMoves.reduce((sum, m) => sum + m.weight, 0);
	let randomThreshold = Math.floor(Math.random() * totalWeight);

	for (const moveEntry of potentialMoves) {
		randomThreshold -= moveEntry.weight;
		if (randomThreshold <= 0) {
			return uciToMove(moveEntry.chosen_move);
		}
	}

	return uciToMove(potentialMoves[0].chosen_move);
}
// ==========================================
// PIECE SQUARE TABLES (PST) - VALUES CORRESPOND TO SQUARE INDICES 0 (A1) TO 63 (H8)
// ==========================================

const pawnMG = [
	0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
	20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5,
	-10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0,
	0,
];
const pawnEG = [
	0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 80, 80, 80, 80, 80, 50, 50, 50, 50, 50,
	50, 50, 50, 30, 30, 30, 30, 30, 30, 30, 30, 20, 20, 20, 20, 20, 20, 20, 20,
	10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0, 0,
	0, 0, 0, 0,
];

const knightPST = [
	-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
	0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20,
	20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20,
	-40, -50, -40, -30, -30, -30, -30, -40, -50,
];

const bishopPST = [
	-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0,
	5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10,
	0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20,
	-10, -10, -10, -10, -10, -10, -20,
];

const rookMG = [
	0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
	-5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
	0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
];
const rookEG = [
	0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const queenPST = [
	-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
	5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5,
	5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10,
	-10, -20,
];

const kingMG = [
	-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
	-30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
	-40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
	-20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
];
const kingEG = [
	-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30,
	-30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30,
	-10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30,
	0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50,
];

export class ChessEngine {
	strength: number;
	name: string;

	constructor(strength: number, name: string) {
		this.strength = strength;
		this.name = name;
	}

	/**
	 * Determines if a pawn on a square is a "Passed Pawn"
	 */
	private isPassedPawn(sq: number, color: Color, board: ChessBoard): boolean {
		const file = sq % 8;
		const rank = Math.floor(sq / 8);
		const enemyPawnIdx =
			(color === Color.White ? Color.Black : Color.White) * 6 +
			Piece.Pawn;
		const enemyPawns = board.pieces[enemyPawnIdx];

		if (color === Color.White) {
			for (let r = rank + 1; r < 8; r++) {
				for (
					let f = Math.max(0, file - 1);
					f <= Math.min(7, file + 1);
					f++
				) {
					if ((enemyPawns & (1n << BigInt(r * 8 + f))) !== 0n)
						return false;
				}
			}
		} else {
			for (let r = rank - 1; r >= 0; r--) {
				for (
					let f = Math.max(0, file - 1);
					f <= Math.min(7, file + 1);
					f++
				) {
					if ((enemyPawns & (1n << BigInt(r * 8 + f))) !== 0n)
						return false;
				}
			}
		}
		return true;
	}

	/**
	 * Evaluates the pawn shield density surrounding the King's perimeter
	 */
	private getKingSafety(
		kingSq: number,
		color: Color,
		board: ChessBoard,
	): number {
		const file = kingSq % 8;
		const rank = Math.floor(kingSq / 8);
		let shieldPoints = 0;
		const ownPawnIdx = color * 6 + Piece.Pawn;
		const ownPawns = board.pieces[ownPawnIdx];

		if (color === Color.White && rank <= 2) {
			const shieldRank = rank + 1;
			for (
				let f = Math.max(0, file - 1);
				f <= Math.min(7, file + 1);
				f++
			) {
				if ((ownPawns & (1n << BigInt(shieldRank * 8 + f))) !== 0n)
					shieldPoints += 15;
				if (
					(ownPawns & (1n << BigInt((shieldRank + 1) * 8 + f))) !==
					0n
				)
					shieldPoints += 5;
			}
		} else if (color === Color.Black && rank >= 5) {
			const shieldRank = rank - 1;
			for (
				let f = Math.max(0, file - 1);
				f <= Math.min(7, file + 1);
				f++
			) {
				if ((ownPawns & (1n << BigInt(shieldRank * 8 + f))) !== 0n)
					shieldPoints += 15;
				if (
					(ownPawns & (1n << BigInt((shieldRank - 1) * 8 + f))) !==
					0n
				)
					shieldPoints += 5;
			}
		}
		return shieldPoints;
	}

	/**
	 * Comprehensive evaluation accounting for material weights, phase, PST maps, and pawn metrics.
	 */
	evaluation(board: ChessBoard): number {
		let mgWhite = 0,
			mgBlack = 0;
		let egWhite = 0,
			egBlack = 0;
		let gamePhaseCount = 0;

		const baseValues = {
			[Piece.Pawn]: 100,
			[Piece.Knight]: 320,
			[Piece.Bishop]: 330,
			[Piece.Rook]: 500,
			[Piece.Queen]: 900,
			[Piece.King]: 0,
		};

		// Game Phase Weight Contributions
		const phaseWeights = {
			[Piece.Pawn]: 0,
			[Piece.Knight]: 1,
			[Piece.Bishop]: 1,
			[Piece.Rook]: 2,
			[Piece.Queen]: 4,
			[Piece.King]: 0,
		};

		for (let sq = 0; sq < 64; sq++) {
			const piece = board.getPieceAtSquare(sq);
			if (!piece) continue;

			const type = piece.pieceType;
			const color = piece.color;

			// Mirror row alignment index strictly for black evaluation mapping
			const pIdx = color === Color.White ? sq ^ 56 : sq;
			gamePhaseCount += phaseWeights[type];

			let mgScore = baseValues[type];
			let egScore = baseValues[type];

			switch (type) {
				case Piece.Pawn:
					mgScore += pawnMG[pIdx];
					egScore += pawnEG[pIdx];
					if (this.isPassedPawn(sq, color, board)) {
						const rank = Math.floor(pIdx / 8);
						const passedBonus = rank * 15; // Scaled reward up the ranks
						mgScore += passedBonus;
						egScore += passedBonus * 2; // Passed pawns shine in endgame!
					}
					break;
				case Piece.Knight:
					mgScore += knightPST[pIdx];
					egScore += knightPST[pIdx];
					break;
				case Piece.Bishop:
					mgScore += bishopPST[pIdx];
					egScore += bishopPST[pIdx];
					break;
				case Piece.Rook:
					mgScore += rookMG[pIdx];
					egScore += rookEG[pIdx];
					break;
				case Piece.Queen:
					mgScore += queenPST[pIdx];
					egScore += queenPST[pIdx];
					break;
				case Piece.King:
					mgScore +=
						kingMG[pIdx] + this.getKingSafety(sq, color, board);
					egScore += kingEG[pIdx];
					break;
			}

			if (color === Color.White) {
				mgWhite += mgScore;
				egWhite += egScore;
			} else {
				mgBlack += mgScore;
				egBlack += egScore;
			}
		}

		// Aggregate relative differentials
		const mgDifferential = mgWhite - mgBlack;
		const egDifferential = egWhite - egBlack;

		// Taper calculations (Limit phase limit maximum to standard initial 24)
		const totalInitialPhase = 24;
		const currentPhase =
			gamePhaseCount > totalInitialPhase
				? totalInitialPhase
				: gamePhaseCount;

		const finalScore = Math.floor(
			(mgDifferential * currentPhase +
				egDifferential * (totalInitialPhase - currentPhase)) /
				totalInitialPhase,
		);

		return board.sideToMove === Color.White ? finalScore : -finalScore;
	}

	getAllLegalMoves(board: ChessBoard): ChessMove[] {
		const moves: ChessMove[] = [];
		for (let sq = 0; sq < 64; sq++) {
			const piece = board.getPieceAtSquare(sq);
			if (piece && piece.color === board.sideToMove) {
				const destinations = board.getPseudoLegalMoves(sq);
				for (const to of destinations) {
					if (
						piece.pieceType === Piece.Pawn &&
						(Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)
					) {
						moves.push({ from: sq, to, promotion: Piece.Queen });
					} else {
						moves.push({ from: sq, to });
					}
				}
			}
		}
		return moves;
	}

	getBestMove(board: ChessBoard, maxDepth: number): ChessMove | null {
		const moves = this.getAllLegalMoves(board);
		if (moves.length === 0) return null;

		let bestMove: ChessMove | null = null;
		let alpha = -Infinity;
		const beta = Infinity;
		const sortedMoves = this.orderMoves(moves, board);

		for (const move of sortedMoves) {
			const nextBoard = board.clone();
			const piece = board.getPieceAtSquare(move.from)!;
			nextBoard.movePiece(move, piece.pieceType, piece.color);
			const score = -this.alphaBetaSearch(
				nextBoard,
				maxDepth - 1,
				-beta,
				-alpha,
			);

			if (score > alpha) {
				alpha = score;
				bestMove = move;
			}
		}
		return bestMove;
	}

	alphaBetaSearch(
		board: ChessBoard,
		depth: number,
		alpha: number,
		beta: number,
	): number {
		const gameStatus = board.didGameEnd();
		if (gameStatus === 1) return -Infinity + depth;
		if (gameStatus === 0) return 0;
		if (depth === 0) return this.evaluation(board);

		const moves = this.getAllLegalMoves(board);
		const sortedMoves = this.orderMoves(moves, board);

		for (const move of sortedMoves) {
			const nextBoard = board.clone();
			const piece = board.getPieceAtSquare(move.from)!;
			nextBoard.movePiece(move, piece.pieceType, piece.color);
			const score = -this.alphaBetaSearch(
				nextBoard,
				depth - 1,
				-beta,
				-alpha,
			);

			if (score >= beta) return beta;
			if (score > alpha) alpha = score;
		}
		return alpha;
	}

	orderMoves(moves: ChessMove[], board: ChessBoard): ChessMove[] {
		return [...moves].sort((a, b) => {
			let scoreA = a.promotion ? 50 : 0;
			let scoreB = b.promotion ? 50 : 0;
			if (board.getPieceAtSquare(a.to)) scoreA += 10;
			if (board.getPieceAtSquare(b.to)) scoreB += 10;
			return scoreB - scoreA;
		});
	}
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const engine = new ChessEngine(5, "AlphaTypeScript");

rl.on("line", async (line) => {
	try {
		const trimmed = line.trim();

		// Parse the new custom text format: "52,36 11,27" -> ChessMove[]
		const moveHistory: ChessMove[] =
			trimmed === ""
				? []
				: trimmed.split(" ").map((moveStr) => {
						const [from, to] = moveStr.split(",").map(Number);
						return { from, to };
					});

		// Fast database lookup for the massive book
		const bookMove = getMassiveBookMove(moveHistory);
		if (bookMove) {
			// Output using the new fast format: "from,to"
			console.log(`${bookMove.from},${bookMove.to}`);
			return;
		}

		// Fallback to normal thinking engine if book doesn't know the position
		const board = new ChessBoard();
		for (const m of moveHistory) {
			const piece = board.getPieceAtSquare(m.from);
			if (piece) board.movePiece(m, piece.pieceType, piece.color);
		}

		const bestMove = engine.getBestMove(board, 4);

		if (bestMove) {
			// Output using the new fast format: "from,to"
			console.log(`${bestMove.from},${bestMove.to}`);
		} else {
			console.log("none"); // No legal moves left (checkmate or stalemate)
		}
		console.log(engine.evaluation(board));
	} catch (err) {
		console.log("error,invalid_input");
	}
});
