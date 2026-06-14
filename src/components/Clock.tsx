import "./components.css";
interface Props {
	timeSec: number;
}
function Clock({ timeSec }: Props) {
	return <div className="clock-container">Time: {timeSec}</div>;
}
export default Clock;
