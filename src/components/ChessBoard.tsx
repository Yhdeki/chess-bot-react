import { useGameState } from "../chessComponents/useGameState.ts";
import "./components.css";
import EvalBar from "./EvalBar.tsx";
import MoveHistory from "./MoveHistory.tsx";
import { InteractivePiece } from "./Piece.tsx";

function ChessBoard() {
	const squares = [];
	const { board, moveHistory } = useGameState();

	// Generate 8 rows (0 to 7) and 8 columns (0 to 7)
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			// Alternating checkerboard logic: sum of row + col
			const isDark = (row + col) % 2 !== 0;
			const squareColor = isDark ? "dark" : "light";
			const pieceName: string | null = board.getPieceAtSquare(
				row * 8 + col,
			);
			squares.push(
				<div key={`${row}-${col}`} className={`square ${squareColor}`}>
					{pieceName && (
						<InteractivePiece
							type={pieceName}
							color={pieceName[0] === "w" ? "w" : "b"}
						/>
					)}
				</div>,
			);
		}
	}

	return (
		<div className="chess-board-container">
			<div className="chess-board">{squares}</div>
			<EvalBar value={0} id="white-bar" />
			<EvalBar value={0} id="black-bar" />
			<MoveHistory moves={moveHistory} />
		</div>
	);
}
export default ChessBoard;
