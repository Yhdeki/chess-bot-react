// Square.tsx
import { Color, Piece } from "../chessComponents/types.ts";
import { InteractivePiece } from "./Piece.tsx";

interface Props {
	piece: { pieceType: Piece; color: Color } | null;
	color: Color;
}

export default function Square({ piece, color }: Props) {
	return (
		<div className={`square ${color === Color.White ? "light" : "dark"}`}>
			{piece && (
				<InteractivePiece type={piece.pieceType} color={piece.color} />
			)}
		</div>
	);
}
