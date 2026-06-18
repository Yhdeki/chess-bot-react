import { Color, Piece, TimeManagementSec } from "../chessComponents/types";
import Clock from "./Clock";
import TakenPieces from "./TakenPieces";

interface Props {
	time: TimeManagementSec;
	id: string;
}
function ChessPlayer({ time, id }: Props) {
	return (
		<div className="player-container" id={id}>
			<Clock timeSec={time}></Clock>
			<TakenPieces
				pieces={
					new Map<{ type: Piece; color: Color }, number>([
						[{ type: Piece.King, color: Color.White }, 95],
						[{ type: Piece.Queen, color: Color.Black }, 88],
					])
				}
			></TakenPieces>
		</div>
	);
}
export default ChessPlayer;
