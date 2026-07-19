import { ChessBoard } from "../chessBoard.ts";
import { PieceType, Color, type ChessMove } from "../types.ts";
import { moveToUci, uciToMove } from "./uciUtils.ts";

export async function getMassiveBookMove(
	moveHistory: ChessMove[],
): Promise<ChessMove | null> {
	const uciHistoryString = moveHistory.map(moveToUci).join(" ");

	let potentialMoves: { chosen_move: string; weight: number }[];
	try {
		const res = await fetch(
			`/api/book-move?history=${encodeURIComponent(uciHistoryString)}`,
		);
		if (!res.ok) return null;
		potentialMoves = await res.json();
	} catch {
		// Book server not running / unreachable — fall back to search rather
		// than crashing the game.
		return null;
	}

	if (potentialMoves.length === 0) {
		return null;
	}

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
// PIECE SQUARE TABLES (PST) - unchanged from your original
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

	private isPassedPawn(sq: number, color: Color, board: ChessBoard): boolean {
		const file = sq % 8;
		const rank = Math.floor(sq / 8);
		const enemyPawnIdx =
			(color === Color.White ? Color.Black : Color.White) * 6 +
			PieceType.Pawn;
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

	private getKingSafety(
		kingSq: number,
		color: Color,
		board: ChessBoard,
	): number {
		const file = kingSq % 8;
		const rank = Math.floor(kingSq / 8);
		let shieldPoints = 0;
		const ownPawnIdx = color * 6 + PieceType.Pawn;
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

	evaluation(board: ChessBoard): number {
		let mgWhite = 0,
			mgBlack = 0;
		let egWhite = 0,
			egBlack = 0;
		let gamePhaseCount = 0;

		let whiteBishopCount = 0;
		let blackBishopCount = 0;

		const baseValues = {
			[PieceType.Pawn]: 100,
			[PieceType.Knight]: 320,
			[PieceType.Bishop]: 330,
			[PieceType.Rook]: 500,
			[PieceType.Queen]: 900,
			[PieceType.King]: 0,
		};

		const phaseWeights = {
			[PieceType.Pawn]: 0,
			[PieceType.Knight]: 1,
			[PieceType.Bishop]: 1,
			[PieceType.Rook]: 2,
			[PieceType.Queen]: 4,
			[PieceType.King]: 0,
		};

		for (let sq = 0; sq < 64; sq++) {
			const piece = board.getPieceAtSquare(sq);
			if (!piece) continue;

			const type = piece.pieceType;
			const color = piece.color;

			const pIdx = color === Color.White ? sq ^ 56 : sq;
			gamePhaseCount += phaseWeights[type];

			let mgScore = baseValues[type];
			let egScore = baseValues[type];

			// Removed this for now...
			// if (type !== PieceType.Pawn && type !== PieceType.King) {
			// 	const mobilityCount = board.getPseudoLegalMoves(sq).length;
			// 	mgScore += mobilityCount * 2;
			// 	egScore += mobilityCount * 2;
			// }

			switch (type) {
				case PieceType.Pawn:
					mgScore += pawnMG[pIdx];
					egScore += pawnEG[pIdx];
					if (this.isPassedPawn(sq, color, board)) {
						const rank = Math.floor(pIdx / 8);
						const passedBonus = rank * 15;
						mgScore += passedBonus;
						egScore += passedBonus * 2;
					}
					break;
				case PieceType.Knight:
					mgScore += knightPST[pIdx];
					egScore += knightPST[pIdx];
					break;
				case PieceType.Bishop:
					mgScore += bishopPST[pIdx];
					egScore += bishopPST[pIdx];
					if (color === Color.White) whiteBishopCount++;
					else blackBishopCount++;
					break;
				case PieceType.Rook: {
					mgScore += rookMG[pIdx];
					egScore += rookEG[pIdx];

					const file = sq % 8;
					let ownPawnOnFile = false;
					let enemyPawnOnFile = false;
					const ownPawnIdx = color * 6 + PieceType.Pawn;
					const enemyPawnIdx =
						(color === Color.White ? Color.Black : Color.White) *
							6 +
						PieceType.Pawn;

					for (let r = 0; r < 8; r++) {
						const fileSq = r * 8 + file;
						if (
							(board.pieces[ownPawnIdx] &
								(1n << BigInt(fileSq))) !==
							0n
						)
							ownPawnOnFile = true;
						if (
							(board.pieces[enemyPawnIdx] &
								(1n << BigInt(fileSq))) !==
							0n
						)
							enemyPawnOnFile = true;
					}
					if (!ownPawnOnFile) {
						if (!enemyPawnOnFile) {
							mgScore += 20;
							egScore += 20;
						} else {
							mgScore += 10;
							egScore += 10;
						}
					}
					break;
				}
				case PieceType.Queen:
					mgScore += queenPST[pIdx];
					egScore += queenPST[pIdx];
					break;
				case PieceType.King:
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

		if (whiteBishopCount >= 2) {
			mgWhite += 30;
			egWhite += 30;
		}
		if (blackBishopCount >= 2) {
			mgBlack += 30;
			egBlack += 30;
		}

		const mgDifferential = mgWhite - mgBlack;
		const egDifferential = egWhite - egBlack;

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
						piece.pieceType === PieceType.Pawn &&
						(Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)
					) {
						moves.push({
							from: sq,
							to,
							promotion: PieceType.Queen,
						});
					} else {
						moves.push({ from: sq, to });
					}
				}
			}
		}
		return moves;
	}

	async getBestMove(
		board: ChessBoard,
		maxDepth: number,
	): Promise<ChessMove | null> {
		const bookMove = await getMassiveBookMove(board.moveHistory);
		if (bookMove) return bookMove;

		const moves = this.getAllLegalMoves(board);
		if (moves.length === 0) return null;

		let bestMove: ChessMove | null = null;
		let alpha = -Infinity;
		const beta = Infinity;
		const sortedMoves = this.orderMoves(moves, board);
		let legalMovesCount = 0;

		for (const move of sortedMoves) {
			const piece = board.getPieceAtSquare(move.from)!;
			const mover = board.sideToMove;
			const undo = board.makeMove(move, piece.pieceType, piece.color);

			if (board.isChecked(mover)) {
				board.unmakeMove(undo);
				continue;
			}
			legalMovesCount++;

			const score = -this.alphaBetaSearch(
				board,
				maxDepth - 1,
				-beta,
				-alpha,
			);
			board.unmakeMove(undo);

			if (score > alpha) {
				alpha = score;
				bestMove = move;
			}
		}

		return legalMovesCount === 0 ? null : bestMove;
	}

	alphaBetaSearch(
		board: ChessBoard,
		depth: number,
		alpha: number,
		beta: number,
	): number {
		if (depth === 0) return this.evaluation(board);

		const moves = this.getAllLegalMoves(board);
		const sortedMoves = this.orderMoves(moves, board);
		let legalMovesCount = 0;

		for (const move of sortedMoves) {
			const piece = board.getPieceAtSquare(move.from)!;
			const mover = board.sideToMove;
			const undo = board.makeMove(move, piece.pieceType, piece.color);

			if (board.isChecked(mover)) {
				board.unmakeMove(undo);
				continue;
			}
			legalMovesCount++;

			const score = -this.alphaBetaSearch(
				board,
				depth - 1,
				-beta,
				-alpha,
			);
			board.unmakeMove(undo);

			if (score >= beta) return beta;
			if (score > alpha) alpha = score;
		}

		if (legalMovesCount === 0) {
			if (board.isChecked(board.sideToMove)) {
				const MATE_SCORE = 1_000_000;
				return -(MATE_SCORE - depth);
			}
			return 0;
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
