// ChessBoard.tsx
import { useGameState } from "../chessComponents/useGameState.ts";
import Square from "./Square.tsx";
import { Color, TimeManagementSec } from "../chessComponents/types.ts";
import ChessPlayer from "./ChessPlayer.tsx";

export default function ChessBoard() {
	const { board } = useGameState();
	const squares = [];

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const sq = row * 8 + col;
			const pieceData = board.getPieceAtSquare(sq);

			squares.push(
				<Square
					key={sq}
					color={(row + col) % 2 !== 0 ? Color.Black : Color.White}
					piece={pieceData}
				/>,
			);
		}
	}

	return (
		<>
			<div className="chess-board">{squares}</div>

			<div className="players-container">
				<ChessPlayer
					time={TimeManagementSec.Minute}
					id="white-player"
				></ChessPlayer>
			</div>
		</>
	);
}
