import { useState, useCallback } from "react";
import { ChessBoard } from "./chessBoard.ts";
import { type ChessMove, Color, Piece } from "./types.ts";

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

	const makeMove = useCallback(
		(move: ChessMove, pieceType: Piece) => {
			// 1. Create a deep clone of the board first
			const nextBoard = new ChessBoard([...board.pieces]);
			nextBoard.sideToMove =
				board.sideToMove === Color.White ? Color.Black : Color.White;

			// 2. Apply the move
			nextBoard.movePiece(move, pieceType, board.sideToMove);

			// 3. Update state
			setBoard(nextBoard);
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
		makeMove,
		loadCustomPosition,
	};
}
