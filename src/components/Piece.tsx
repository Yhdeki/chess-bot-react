// Piece.tsx
import { Color, Piece } from "../chessComponents/types";
import "./components.css";
import React from "react";
import type { DragEvent } from "react";

interface Props {
	type: Piece;
	color: Color;
	square: number;
	draggable: boolean;
}

// NOTE: Switched from the previous manual mouse-position drag implementation
// to native HTML5 drag-and-drop. The old version tracked pixel offsets but
// had no square-collision detection, so it couldn't actually move a piece
// from square to square. Native DnD lets the browser handle the drag ghost
// and Square.tsx just needs onDrop — much less code and more robust.
export const InteractivePiece: React.FC<Props> = ({
	type,
	color,
	square,
	draggable,
}: Props) => {
	const path = getPieceImgPath(type, color);

	const handleDragStart = (e: DragEvent<HTMLImageElement>) => {
		e.dataTransfer.setData("text/plain", String(square));
		e.dataTransfer.effectAllowed = "move";
	};

	return (
		<div className="piece-container">
			<img
				src={"/chess-bot-react/src/assets/" + path}
				alt="chess-piece"
				className={`piece-img ${draggable ? "draggable-piece" : ""}`}
				draggable={draggable}
				onDragStart={handleDragStart}
			/>
		</div>
	);
};

export const getPieceImgPath = (type: Piece, color: Color) => {
	const typeChars = ["p", "n", "b", "r", "q", "k"];
	const colorChar = color === Color.White ? "l" : "d";
	return `Chess_${typeChars[type]}${colorChar}t45.svg`;
};
