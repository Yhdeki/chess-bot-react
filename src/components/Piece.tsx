import "./components.css";

interface Props {
	type: string;
}

function Piece({ type }: Props) {
	return <div>{type}</div>;
}

export default Piece;
