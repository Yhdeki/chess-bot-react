import "./components.css";
import { getPieceImgPath } from "./Piece";

interface Props {
	pieces: string[];
}

function TakenPieces({ pieces }: Props) {
	return (
		<div className="taken-pieces-container">
			{pieces.map((piece) => (
				<img src={getPieceImgPath(piece)} alt="" />
			))}
		</div>
	);
}
export default TakenPieces;
