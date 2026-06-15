import type { TimeManagementSec } from "../chessComponents/types";
import "./components.css";
interface Props {
	timeSec: TimeManagementSec;
}
function Clock({ timeSec }: Props) {
	return <div className="clock-container">Time: {timeSec}s</div>;
}
export default Clock;
