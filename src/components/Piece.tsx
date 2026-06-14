// import "./components.css";

// interface Props {
// 	pieceName: string;
// }

// function Piece({ pieceName }: Props) {
// 	const getPieceImgPath = (pieceName: string): string => {
// 		const PREFIX: string = "src/assets/Chess_";
// 		const SUFFIX: string = "t45.svg";
// 		const colorLetter = pieceName[0].toLowerCase() === "w" ? "l" : "d";
// 		const pieceType: string = pieceName.split(" ")[1].toLowerCase();
// 		if (pieceType === "knight") {
// 			return PREFIX + "n" + colorLetter + SUFFIX;
// 		}

// 		return PREFIX + pieceType[0] + colorLetter + SUFFIX;
// 	};
// 	return (
// 		<div className="piece-container">
// 			<img src={getPieceImgPath(pieceName)} className="piece-img" />
// 		</div>
// 	);
// }

// export default Piece;
import React, { useState } from "react";

// Define strict types for chess pieces and colors
type PieceColor = "w" | "b";

interface ChessPieceProps {
	type: string;
	color: PieceColor;
}

export const InteractivePiece: React.FC<ChessPieceProps> = ({
	type,
	color,
}) => {
	const [isDragging, setIsDragging] = useState(false);

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		setIsDragging(true);
		// Store piece data and source square in the drag dataTransfer object
		e.dataTransfer.setData("text/plain", JSON.stringify({ type, color }));
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	return (
		<div
			className="piece-container"
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			style={{
				fontSize: "3rem",
				cursor: "grab",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				userSelect: "none",
				opacity: isDragging ? 0.4 : 1,
				transition: "opacity 0.1s ease",
			}}
		>
			<img src={getPieceImgPath(type)} className="piece-img" />
		</div>
	);
};

export const getPieceImgPath = (pieceName: string): string => {
	const PREFIX: string = "src/assets/Chess_";
	const SUFFIX: string = "t45.svg";
	const colorLetter = pieceName[0].toLowerCase() === "w" ? "l" : "d";
	const pieceType: string = pieceName.split(" ")[1].toLowerCase();
	if (pieceType === "knight") {
		return PREFIX + "n" + colorLetter + SUFFIX;
	}

	return PREFIX + pieceType[0] + colorLetter + SUFFIX;
};
// Quick Parent Container (Board Square) Demonstration
export const BoardSquare: React.FC<{
	id: string;
	children?: React.ReactNode;
}> = ({ id, children }) => {
	const [isOver, setIsOver] = useState(false);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault(); // Required to allow dropping
	};

	const handleDragEnter = () => setIsOver(true);
	const handleDragLeave = () => setIsOver(false);

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsOver(false);
		const dataStr = e.dataTransfer.getData("text/plain");
		if (dataStr) {
			const { type, color, from } = JSON.parse(dataStr);
			console.log(`Moved ${color}${type} from ${from} to ${id}`);
			// Integrate your state management or logic engine (e.g., chess.js) here
		}
	};

	return (
		<div
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			style={{
				width: "80px",
				height: "80px",
				backgroundColor: isOver ? "#baca44" : "#eeeed2", // Highlights target on hover
				border: "1px solid #769656",
				display: "inline-block",
			}}
		>
			{children}
		</div>
	);
};
