import { TimeManagementSec } from "../chessComponents/types";
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
			<TakenPieces pieces={["white king"]}></TakenPieces>
		</div>
	);
}
export default ChessPlayer;
