// server/db.ts
import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "mega_opening_book.db");

// Opened read-only: this process only ever answers queries. Writes happen
// exclusively in importBook.ts, run separately whenever you add more PGNs.
// (Run importBook.ts before starting this server, not at the same time.)
export const db = new Database(DB_PATH, {
	readonly: true,
	fileMustExist: true,
});
