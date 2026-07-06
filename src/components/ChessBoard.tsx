// ChessBoard.tsx
import { useGameState } from "../chessComponents/useGameState.ts";
import Square from "./Square.tsx";
import { Color } from "../chessComponents/types.ts";
import ChessPlayer from "./ChessPlayer.tsx";
import MoveHistory from "./MoveHistory.tsx";
import EvalBar from "./EvalBar.tsx";

export default function ChessBoard() {
	const {
		board,
		selectedSquare,
		legalMoves,
		sideToMove,
		gameOver,
		handleSquareClick,
		handlePieceDrop,
		whiteTimeSec,
		blackTimeSec,
		evalScore,
		showEvalBar,
		toggleEvalBar,
		capturedWhitePieces,
		capturedBlackPieces,
		resetGame,
	} = useGameState();

	const squares = [];
	// Render from rank 8 down to rank 1 so a1 is bottom-left, matching a
	// standard board orientation with White at the bottom.
	for (let row = 7; row >= 0; row--) {
		for (let col = 0; col < 8; col++) {
			const sq = row * 8 + col;
			const pieceData = board.getPieceAtSquare(sq);
			const isDraggable =
				pieceData !== null && pieceData.color === sideToMove;

			squares.push(
				<Square
					key={sq}
					squareIndex={sq}
					color={(row + col) % 2 !== 0 ? Color.Black : Color.White}
					piece={pieceData}
					isSelected={selectedSquare === sq}
					isLegalTarget={legalMoves.includes(sq)}
					isDraggable={isDraggable}
					onSquareClick={handleSquareClick}
					onPieceDrop={handlePieceDrop}
				/>,
			);
		}
	}

	return (
		<div className="chess-board-container">
			<div className="players-container">
				<ChessPlayer
					id="black-player"
					timeSec={blackTimeSec}
					isActive={sideToMove === Color.Black && !gameOver}
					capturedPieces={capturedBlackPieces}
				/>
			</div>

			<div className="board-and-bar">
				<EvalBar
					id="eval-bar"
					value={evalScore}
					visible={showEvalBar}
					onToggleVisible={toggleEvalBar}
				/>
				<div className="chess-board">{squares}</div>
			</div>

			<div className="players-container">
				<ChessPlayer
					id="white-player"
					timeSec={whiteTimeSec}
					isActive={sideToMove === Color.White && !gameOver}
					capturedPieces={capturedWhitePieces}
				/>
			</div>

			<MoveHistory moves={board.moveHistory} />

			{gameOver && (
				<div className="game-over-banner">
					{gameOver.reason === "checkmate" &&
						`Checkmate — ${gameOver.winner === Color.White ? "White" : "Black"} wins`}
					{gameOver.reason === "timeout" &&
						`Time out — ${gameOver.winner === Color.White ? "White" : "Black"} wins`}
					{gameOver.reason === "stalemate" && "Stalemate — draw"}
					<button className="reset-btn" onClick={resetGame}>
						New Game
					</button>
				</div>
			)}
		</div>
	);
}
