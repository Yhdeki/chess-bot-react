import { Color, TimeManagementSec } from "../chessComponents/types.ts";
import { useGameState } from "../chessComponents/useGameState.ts";
import ChessPlayer from "./ChessPlayer.tsx";
import "./components.css";
import EvalBar from "./EvalBar.tsx";
import MoveHistory from "./MoveHistory.tsx";
import Square from "./Square.tsx";

function ChessBoard() {
	const squares = [];
	const { board, moveHistory } = useGameState();

	// Generate 8 rows (0 to 7) and 8 columns (0 to 7)
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			// Alternating checkerboard logic: sum of row + col
			const pieceName: string | null = board.getPieceAtSquare(
				row * 8 + col,
			);
			squares.push(
				<Square
					key={`${row}-${col}`}
					color={(row + col) % 2 !== 0 ? Color.Black : Color.White}
					piece={pieceName}
				/>,
			);
		}
	}

	return (
		<div className="chess-board-container">
			<ChessPlayer
				time={TimeManagementSec.FiveMin}
				id="white-player"
			></ChessPlayer>
			<div className="chess-board">{squares}</div>
			<ChessPlayer
				time={TimeManagementSec.FiveMin}
				id="black-player"
			></ChessPlayer>
			<EvalBar value={0} id="white-bar" />
			<EvalBar value={0} id="black-bar" />
			<MoveHistory moves={moveHistory} />
		</div>
	);
}
export default ChessBoard;
