// server/index.ts
import express from "express";
import { db } from "./dataBase.ts";

const app = express();
const PORT = 3001;

const bookMoveQuery = db.prepare(`
	SELECT chosen_move, weight
	FROM openings
	WHERE history_string = ?
	ORDER BY weight DESC
	LIMIT 5
`);

app.get("/api/book-move", (req, res) => {
	const history =
		typeof req.query.history === "string" ? req.query.history : "";
	const rows = bookMoveQuery.all(history);
	res.json(rows);
});

app.listen(PORT, () => {
	console.log(`Opening book server running on http://localhost:${PORT}`);
});
