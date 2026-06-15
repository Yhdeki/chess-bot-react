import { useState, useCallback } from "react";
import { ChessBoard } from "./chessBoard.ts";
import { type ChessMove, Color } from "./types.ts";

export function useGameState() {
	// Single instance of engine logic inside standard state
	const [board, setBoard] = useState(() => new ChessBoard());
	const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
	const [legalMoves, setLegalMoves] = useState<number[]>([]);

	const selectSquare = useCallback(
		(sq: number) => {
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
		[board],
	);

	const executeMove = useCallback(
		(from: number, to: number) => {
			const pieceInfo = board.getPieceAtSquare(from);
			if (!pieceInfo) return;

			// 1. Structural deep copy generation
			const nextBoard = board.clone();

			// 2. Compute state shift modifications
			const movePayload: ChessMove = { from, to };
			nextBoard.movePiece(
				movePayload,
				pieceInfo.pieceType,
				pieceInfo.color,
			);

			// 3. Push complete object swap into hook memory container
			setBoard(nextBoard);
			setSelectedSquare(null);
			setLegalMoves([]);
		},
		[board],
	);

	const loadCustomPosition = useCallback((customPieces: bigint[]) => {
		setBoard(new ChessBoard(customPieces));
		setSelectedSquare(null);
		setLegalMoves([]);
	}, []);

	return {
		board,
		selectedSquare,
		legalMoves,
		turn: board.sideToMove === Color.White ? "white" : "black",
		selectSquare,
		executeMove,
		loadCustomPosition,
	};
}
