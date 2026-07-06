import { useState, useCallback, useEffect, useRef } from "react";
import { ChessBoard } from "./chessBoard.ts";
import { type ChessMove, Color, Piece, TimeManagementSec } from "./types.ts";

export type GameOverReason = "checkmate" | "stalemate" | "timeout";
export interface GameOverInfo {
	reason: GameOverReason;
	winner: Color | null; // null = draw (stalemate)
}

export function useGameState(
	initialTimeSec: number = TimeManagementSec.Minute,
) {
	// Single instance of engine logic inside standard state
	const [board, setBoard] = useState(() => new ChessBoard());
	const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
	const [legalMoves, setLegalMoves] = useState<number[]>([]);

	// --- Clocks ---
	const [whiteTimeSec, setWhiteTimeSec] = useState(initialTimeSec);
	const [blackTimeSec, setBlackTimeSec] = useState(initialTimeSec);
	const [clockRunning, setClockRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// --- Game over ---
	const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);

	// --- Eval bar (left open for your engine — see EvalBar.tsx) ---
	const [evalScore, setEvalScore] = useState(0); // centipawns, + favors white
	const [showEvalBar, setShowEvalBar] = useState(true);

	const selectSquare = useCallback(
		(sq: number) => {
			if (gameOver) return;
			const piece = board.getPieceAtSquare(sq);

			// Only select squares containing pieces belonging to the active player
			if (piece && piece.color === board.sideToMove) {
				setSelectedSquare(sq);
				setLegalMoves(board.getLegalMoves(sq));
			} else {
				setSelectedSquare(null);
				setLegalMoves([]);
			}
		},
		[board, gameOver],
	);

	const makeMove = useCallback(
		(move: ChessMove, pieceType: Piece) => {
			// 1. Create a deep clone of the board first
			const nextBoard = board.clone();

			// 2. Apply the move (movePiece flips sideToMove internally)
			nextBoard.movePiece(move, pieceType, board.sideToMove);

			// 3. Update state
			setBoard(nextBoard);
			setSelectedSquare(null);
			setLegalMoves([]);

			// 4. Check for game end
			const result = nextBoard.didGameEnd();
			if (result !== null) {
				setClockRunning(false);
				if (result === 1) {
					// side to move (after the flip) has no moves and is in check -> they lost
					setGameOver({
						reason: "checkmate",
						winner:
							nextBoard.sideToMove === Color.White
								? Color.Black
								: Color.White,
					});
				} else {
					setGameOver({ reason: "stalemate", winner: null });
				}
			}
		},
		[board],
	);

	// Attempt a move between two squares (used by both click-to-move and drag-and-drop).
	// Returns true if the move was made, false if illegal.
	const attemptMove = useCallback(
		(fromSq: number, toSq: number): boolean => {
			if (gameOver) return false;
			const pieceInfo = board.getPieceAtSquare(fromSq);
			if (!pieceInfo || pieceInfo.color !== board.sideToMove) return false;

			const legal = board.getLegalMoves(fromSq);
			if (!legal.includes(toSq)) return false;

			// Start the clock on the very first move of the game
			if (!clockRunning) setClockRunning(true);

			makeMove({ from: fromSq, to: toSq }, pieceInfo.pieceType);
			return true;
		},
		[board, gameOver, clockRunning, makeMove],
	);

	// Unified click handler: first click selects, second click (on a legal target) moves.
	const handleSquareClick = useCallback(
		(sq: number) => {
			if (gameOver) return;
			if (selectedSquare !== null && legalMoves.includes(sq)) {
				attemptMove(selectedSquare, sq);
			} else {
				selectSquare(sq);
			}
		},
		[selectedSquare, legalMoves, attemptMove, selectSquare, gameOver],
	);

	// Drag-and-drop handler: Square calls this with (fromSquare, toSquare) on drop.
	const handlePieceDrop = useCallback(
		(fromSq: number, toSq: number) => {
			if (fromSq === toSq) return;
			attemptMove(fromSq, toSq);
		},
		[attemptMove],
	);

	const loadCustomPosition = useCallback((customPieces: bigint[]) => {
		setBoard(new ChessBoard(customPieces));
		setSelectedSquare(null);
		setLegalMoves([]);
		setGameOver(null);
	}, []);

	const resetGame = useCallback(() => {
		setBoard(new ChessBoard());
		setSelectedSquare(null);
		setLegalMoves([]);
		setGameOver(null);
		setWhiteTimeSec(initialTimeSec);
		setBlackTimeSec(initialTimeSec);
		setClockRunning(false);
		setEvalScore(0);
	}, [initialTimeSec]);

	const toggleEvalBar = useCallback(() => setShowEvalBar((v) => !v), []);

	// --- Clock ticking ---
	useEffect(() => {
		if (!clockRunning || gameOver) {
			if (intervalRef.current) clearInterval(intervalRef.current);
			return;
		}

		intervalRef.current = setInterval(() => {
			if (board.sideToMove === Color.White) {
				setWhiteTimeSec((t) => {
					const next = Math.max(0, t - 1);
					if (next === 0) {
						setGameOver({ reason: "timeout", winner: Color.Black });
						setClockRunning(false);
					}
					return next;
				});
			} else {
				setBlackTimeSec((t) => {
					const next = Math.max(0, t - 1);
					if (next === 0) {
						setGameOver({ reason: "timeout", winner: Color.White });
						setClockRunning(false);
					}
					return next;
				});
			}
		}, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
		// board.sideToMove is what determines which clock ticks; re-run on every move
	}, [clockRunning, gameOver, board]);

	return {
		board,
		selectedSquare,
		legalMoves,
		turn: board.sideToMove === Color.White ? "white" : "black",
		sideToMove: board.sideToMove,
		gameOver,

		// selection / movement
		selectSquare,
		makeMove,
		attemptMove,
		handleSquareClick,
		handlePieceDrop,
		loadCustomPosition,
		resetGame,

		// clocks
		whiteTimeSec,
		blackTimeSec,
		clockRunning,

		// eval bar — you drive `evalScore` from your own engine (e.g. after each
		// move, run your search and call setEvalScore(centipawns))
		evalScore,
		setEvalScore,
		showEvalBar,
		toggleEvalBar,

		// captured pieces, split by the color that was captured (for TakenPieces)
		capturedWhitePieces: board.capturedPieces.filter(
			(p) => p.color === Color.White,
		),
		capturedBlackPieces: board.capturedPieces.filter(
			(p) => p.color === Color.Black,
		),
	};
}