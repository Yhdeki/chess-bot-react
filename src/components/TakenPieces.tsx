import "./components.css";
import { getPieceImgPath } from "./Piece";
import { Color, Piece } from "../chessComponents/types";

interface Props {
	pieces: { type: Piece; color: Color }[];
}
function TakenPieces({ pieces }: Props) {
	return (
		<div className="taken-pieces-container">
			{pieces.map((piece, idx) => (
				<img
					src={
						"/chess-bot-react/src/assets/" +
						getPieceImgPath(piece.type, piece.color)
					}
					alt=""
					className="taken-piece-img"
					key={`${piece.type}-${piece.color}-${idx}`}
				/>
			))}
		</div>
	);
}
export default TakenPieces;
