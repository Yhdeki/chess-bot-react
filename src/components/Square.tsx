import type { Color } from "../chessComponents/types";
import "./components.css";
import { InteractivePiece } from "./Piece";

interface Props {
	piece: string | null;
	color: Color;
	key: string;
}

function Square({ piece, color, key }: Props) {
	return (
		<div key={key} className={`square ${color ? "light" : "dark"}`}>
			{piece && <InteractivePiece type={piece} color={color} />}
		</div>
	);
}
export default Square;
