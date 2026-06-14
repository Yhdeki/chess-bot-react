import { Piece, TimeManagementSec } from "../chessComponents/types";
import Clock from "./Clock";
import TakenPieces from "./TakenPieces";

function ChessPlayer() {
	const time = TimeManagementSec.FiveMin;
	return (
		<div className="player-container">
			<Clock timeSec={3000}></Clock>
			<TakenPieces pieces={["white king"]}></TakenPieces>
		</div>
	);
}
export default ChessPlayer;
