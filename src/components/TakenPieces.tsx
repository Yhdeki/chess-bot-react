import "./components.css";
import { getPieceImgPath } from "./Piece";
import {
	Color,
	getPieceNameByType,
	type Piece,
} from "../chessComponents/types";

interface Props {
	pieces: Map<{ type: Piece; color: Color }, number>;
}

function TakenPieces({ pieces }: Props) {
	return (
		<div className="taken-pieces-container">
			{[...pieces.keys()].map((piece) => {
				return piece ? (
					<img
						src={getPieceImgPath(piece.type, piece.color)}
						alt=""
						key={piece.type + piece.color}
					/>
				) : null;
			})}
		</div>
	);
}
export default TakenPieces;
