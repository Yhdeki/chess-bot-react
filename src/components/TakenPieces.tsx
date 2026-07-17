import "./components.css";
import { getPieceImgPath } from "./Piece";
import { type ChessPiece } from "../chessComponents/types";

interface Props {
	pieces: ChessPiece[];
}
function TakenPieces({ pieces }: Props) {
	return (
		<div className="taken-pieces-container">
			{pieces.map((piece, idx) => (
				<img
					src={
						"/chess-bot-react/src/assets/" +
						getPieceImgPath(piece.pieceType, piece.color)
					}
					alt=""
					className="taken-piece-img"
					key={`${piece.pieceType}-${piece.color}-${idx}`}
				/>
			))}
		</div>
	);
}
export default TakenPieces;
