// useGameState.ts
import { useState, useCallback } from "react";
import { ChessBoard } from "../chessComponents/chessBoard.ts";
import { Color, type ChessMove, type Piece } from "./types.ts";

export function useGameState() {
	const [board, setBoard] = useState(() => new ChessBoard());
	const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
	const [legalMoves, setLegalMoves] = useState<number[]>([]);
	const [turn, setTurn] = useState<"white" | "black">("white");
	const [moveHistory, setMoveHistory] = useState<string[]>(["e4 e5"]);

	const selectSquare = useCallback(
		(sq: number) => {
			const moves = board.getLegalMoves(sq); // you'll implement this
			setSelectedSquare(sq);
			setLegalMoves(moves);
		},
		[board],
	);

	const makeMove = useCallback(
		(move: ChessMove, pieceType: Piece) => {
			const newBoard = board.clone(); // you'll add this
			newBoard.movePiece(
				move,
				pieceType,
				turn === "white" ? Color.White : Color.Black,
			);
			setMoveHistory(["ed e5", "nf3 nc6"]);
			setBoard(newBoard);
			setTurn((t) => (t === "white" ? "black" : "white"));
			setSelectedSquare(null);
			setLegalMoves([]);
		},
		[board, turn],
	);

	return {
		board,
		selectedSquare,
		legalMoves,
		turn,
		moveHistory,
		selectSquare,
		makeMove,
	};
}
