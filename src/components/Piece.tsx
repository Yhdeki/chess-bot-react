// Piece.tsx
import React, { useState } from "react";
import { Color, Piece } from "../chessComponents/types";
import "./components.css";
interface Props {
	type: Piece;
	color: Color;
}

const FIXED_X = 500;
const FIXED_Y = 300;
// Define a snapping threshold in pixels
const SNAP_THRESHOLD = 100;

export const InteractivePiece: React.FC<Props> = ({ type, color }) => {
	const path = getPieceImgPath(type, color);

	// Track the current visual position of the div
	const [position, setPosition] = useState<{ x: number; y: number }>({
		x: 100,
		y: 100,
	});
	// Track where the mouse started clicking inside the div
	const [dragStartOffset, setDragStartOffset] = useState<{
		x: number;
		y: number;
	}>({ x: 0, y: 0 });

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		// Calculate exactly where the user clicked inside the div
		setDragStartOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});

		// Required for Firefox support to initiate a native drag
		e.dataTransfer.setData("text/plain", "");
	};

	const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		// Calculate the drop coordinates relative to the viewport
		const dropX = e.clientX - dragStartOffset.x;
		const dropY = e.clientY - dragStartOffset.y;

		// Calculate distance from the fixed target position
		const distanceX = Math.abs(dropX - FIXED_X);
		const distanceY = Math.abs(dropY - FIXED_Y);

		// Snap to the fixed place if dropped close enough, otherwise stay where dropped
		if (distanceX < SNAP_THRESHOLD && distanceY < SNAP_THRESHOLD) {
			setPosition({ x: FIXED_X, y: FIXED_Y });
		} else {
			setPosition({ x: dropX, y: dropY });
		}
	};
	return (
		<div
			className="piece-container"
			draggable
			onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
		>
			<img
				src={"/chess-bot-react/src/assets/" + path}
				alt="chess piece"
				className="piece-img"
			/>
		</div>
	);
};

export const getPieceImgPath = (type: Piece, color: Color) => {
	const typeChars = ["p", "n", "b", "r", "q", "k"];
	const colorChar = color === Color.White ? "l" : "d";
	return `Chess_${typeChars[type]}${colorChar}t45.svg`;
};
