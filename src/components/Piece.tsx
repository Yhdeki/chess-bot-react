import "./components.css";

interface Props {
	pieceName: string;
}

function Piece({ pieceName }: Props) {
	const getPieceImgPath = (pieceName: string): string => {
		const PREFIX: string = "src/assets/Chess_";
		const SUFFIX: string = "t45.svg";
		const colorLetter = pieceName[0].toLowerCase() === "w" ? "l" : "d";
		const pieceType: string = pieceName.split(" ")[1].toLowerCase();
		if (pieceType === "knight") {
			return PREFIX + "n" + colorLetter + SUFFIX;
		}

		return PREFIX + pieceType[0] + colorLetter + SUFFIX;
	};
	return (
		<div className="piece-container">
			<img src={getPieceImgPath(pieceName)} className="piece-img" />
		</div>
	);
}

export default Piece;
