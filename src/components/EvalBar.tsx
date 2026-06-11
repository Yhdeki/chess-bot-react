import "./components.css";

interface Props {
	value: number;
	id: string;
}
function EvalBar({ value, id }: Props) {
	const STARTING_VALUE: number = 16;
	let whiteBar = STARTING_VALUE;
	let blackBar = STARTING_VALUE;
	if (value > 0) {
		whiteBar += value;
		blackBar -= value;
	} else {
		whiteBar -= value;
		blackBar += value;
	}

	return <div className="bar-container" id={id}></div>;
}

export default EvalBar;
