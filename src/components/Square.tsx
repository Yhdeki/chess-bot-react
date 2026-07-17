// Square.tsx
import { Color, type ChessPiece } from "../chessComponents/types.ts";
import { InteractivePiece } from "./Piece.tsx";
import type { DragEvent } from "react";

interface Props {
	piece: ChessPiece | null;
	color: Color;
	squareIndex: number;
	isSelected: boolean;
	isLegalTarget: boolean;
	isDraggable: boolean;
	onSquareClick: (sq: number) => void;
	onPieceDrop: (fromSq: number, toSq: number) => void;
}

export default function Square({
	piece,
	color,
	squareIndex,
	isSelected,
	isLegalTarget,
	isDraggable,
	onSquareClick,
	onPieceDrop,
}: Props) {
	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault(); // required to allow a drop
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const fromSq = Number(e.dataTransfer.getData("text/plain"));
		if (!Number.isNaN(fromSq)) onPieceDrop(fromSq, squareIndex);
	};

	const classes = [
		"square",
		color === Color.White ? "light" : "dark",
		isSelected ? "selected-square" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={classes}
			onClick={() => onSquareClick(squareIndex)}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{piece && (
				<InteractivePiece
					type={piece.pieceType}
					color={piece.color}
					square={squareIndex}
					draggable={isDraggable}
				/>
			)}
			{isLegalTarget && (
				<div
					className={`legal-move-dot ${piece ? "capture-dot" : ""}`}
				/>
			)}
		</div>
	);
}
