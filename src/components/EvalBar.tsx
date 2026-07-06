import "./components.css";

interface Props {
	value: number;
	id: string;
	visible: boolean;
	onToggleVisible: () => void;
}

// This component only renders whatever `value` it's given — it does not call
// any engine itself. To wire your engine in:
//   1. In useGameState.ts, after a move is made (or on an interval / worker
//      message from your search), call setEvalScore(<centipawns from white's
//      perspective>).
//   2. Pass evalScore from useGameState down into <EvalBar value={evalScore} />.
// That's the entire integration surface — nothing else needs to change.

const MAX_EVAL_CP = 1000; // clamp bar scaling at +/-10 pawns of advantage

function EvalBar({ value, id, visible, onToggleVisible }: Props) {
	if (!visible) {
		return (
			<button
				className="eval-bar-show-btn"
				onClick={onToggleVisible}
				title="Show eval bar"
			>
				Show Eval
			</button>
		);
	}

	const clamped = Math.max(-MAX_EVAL_CP, Math.min(MAX_EVAL_CP, value));
	// 50% = equal. Positive value shifts the split in white's favor.
	const whitePercent = 50 + (clamped / MAX_EVAL_CP) * 50;

	const displayScore =
		Math.abs(value) >= 10000
			? `#${value > 0 ? "" : "-"}` // mate-in-N convention left to caller if desired
			: (value / 100).toFixed(1);

	return (
		<div className="eval-bar-wrapper" id={id}>
			<div className="eval-bar-track">
				<div
					className="eval-bar-white"
					style={{ height: `${whitePercent}%` }}
				/>
				<div
					className="eval-bar-black"
					style={{ height: `${100 - whitePercent}%` }}
				/>
			</div>
			<div className="eval-bar-score">{displayScore}</div>
			<button
				className="eval-bar-hide-btn"
				onClick={onToggleVisible}
				title="Hide eval bar"
			>
				Hide
			</button>
		</div>
	);
}

export default EvalBar;
