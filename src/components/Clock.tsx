import "./components.css";

interface Props {
	timeSec: number;
	isActive: boolean;
}

function formatTime(totalSeconds: number): string {
	const mins = Math.floor(totalSeconds / 60);
	const secs = totalSeconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function Clock({ timeSec, isActive }: Props) {
	const lowTime = timeSec <= 10;
	return (
		<div
			className={`clock-container ${isActive ? "clock-active" : ""} ${
				lowTime ? "clock-low" : ""
			}`}
		>
			{formatTime(timeSec)}
		</div>
	);
}
export default Clock;
