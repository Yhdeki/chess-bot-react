import { type ChessPiece } from "../chessComponents/types";
import Clock from "./Clock";
import TakenPieces from "./TakenPieces";

interface Props {
	timeSec: number;
	id: string;
	isActive: boolean;
	capturedPieces: ChessPiece[];
}
function ChessPlayer({ timeSec, id, isActive, capturedPieces }: Props) {
	return (
		<div
			className={`player-container ${isActive ? "active-player" : ""}`}
			id={id}
		>
			<Clock timeSec={timeSec} isActive={isActive}></Clock>
			<TakenPieces pieces={capturedPieces}></TakenPieces>
		</div>
	);
}
export default ChessPlayer;
