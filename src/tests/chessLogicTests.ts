import { ChessBoard } from "../chessComponents/chessBoard.ts";
import { Knight } from "../chessComponents/pieces.ts";
import { Player } from "../chessComponents/player.ts";
import { Color } from "../chessComponents/types.ts";

const gameBoard = new ChessBoard();
const player = new Player(true, gameBoard);
const player2 = new Player(false, gameBoard);

function printBitboard(bitboard: bigint): void {
	let boardStr = "";
	for (let rank = 7; rank >= 0; rank--) {
		let rankStr = "";
		for (let file = 0; file < 8; file++) {
			const square = rank * 8 + file;
			// Check if the bit at the current square is set
			const isSet = (bitboard & (1n << BigInt(square))) !== 0n;
			rankStr += isSet ? "1 " : ". ";
		}
		boardStr += rankStr + "\n";
	}
	console.log(boardStr);
}

player.movePiece(
	new Knight(gameBoard.sideToMove === Color.White ? true : false),
	{ from: 1 * 8 + 2, to: 3 * 8 + 3 },
);
printBitboard(gameBoard.combinedOccupancy);
