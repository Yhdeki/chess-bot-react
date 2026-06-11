import "./components.css";

interface Props {
	moves: string[];
}

function MoveHistory({ moves }: Props) {
	return <div className="move-history-container">{moves}</div>;
}

export default MoveHistory;
