import "./components.css";
import { ChessBoard as ChessBoardClass } from "../chessComponents/chessBoard.ts";
function ChessBoard() {
	const squares = [];
	const gameBoard = new ChessBoardClass();
	// Generate 8 rows (0 to 7) and 8 columns (0 to 7)
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			// Alternating checkerboard logic: sum of row + col
			const isDark = (row + col) % 2 !== 0;
			const squareColor = isDark ? "dark" : "light";

			squares.push(
				<div key={`${row}-${col}`} className={`square ${squareColor}`}>
					{gameBoard.getPieceAtSquare(row * 8 + col)}
				</div>,
			);
		}
	}

	return (
		<div className="chessboard-container">
			<div className="chessboard">{squares}</div>
		</div>
	);
}
export default ChessBoard;
