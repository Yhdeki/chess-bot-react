import "./components.css";
import { type ChessMove } from "../chessComponents/types";

interface Props {
	moves: ChessMove[];
}

// Not part of your types.ts, so kept local to this component rather than
// asking you to add UI-only helpers to your engine's type file.
function squareToAlgebraic(sq: number): string {
	const file = String.fromCharCode("a".charCodeAt(0) + (sq % 8));
	const rank = Math.floor(sq / 8) + 1;
	return `${file}${rank}`;
}

// NOTE: Full SAN (e.g. "Nf3", "exd5+", "O-O") needs piece type, capture flag,
// disambiguation and check/mate status *at the time of the move* — none of
// which ChessMove stores (it's just {from, to, promotion}). Reconstructing
// that would mean replaying the whole game against board state. For now this
// renders plain coordinate notation ("e2e4"), which is unambiguous and cheap.
// If you want real SAN, the cleanest fix is to have movePiece() return a
// descriptive move object (piece, capture, check) at the time it's made.
function formatMove(move: ChessMove): string {
	const from = squareToAlgebraic(move.from);
	const to = squareToAlgebraic(move.to);
	const promo =
		move.promotion !== undefined
			? `=${["", "N", "B", "R", "Q", ""][move.promotion] || ""}`
			: "";
	return `${from}${to}${promo}`;
}

function MoveHistory({ moves }: Props) {
	const pairs: { num: number; white?: ChessMove; black?: ChessMove }[] = [];
	for (let i = 0; i < moves.length; i += 2) {
		pairs.push({
			num: i / 2 + 1,
			white: moves[i],
			black: moves[i + 1],
		});
	}

	return (
		<div className="move-history-container">
			<div className="move-history-title">Moves</div>
			<ol className="move-history-list">
				{pairs.map((pair) => (
					<li key={pair.num} className="move-history-row">
						<span className="move-number">{pair.num}.</span>
						<span className="move-white">
							{pair.white ? formatMove(pair.white) : ""}
						</span>
						<span className="move-black">
							{pair.black ? formatMove(pair.black) : ""}
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}

export default MoveHistory;
