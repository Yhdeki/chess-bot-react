# Chess Bot Implementation Plan

This document describes a complete, structured plan for
implementing a chess bot in TypeScript. Each major topic includes detailed explanations and example TypeScript snippets.

## 1. Project Structure

1. `src/chessComponents/chessBoard.ts`
    - Define the board representation and bitboard utilities.
2. `src/chessComponents/pieces.ts`
    - Define piece classes, move validation, and move execution.
3. `src/chessComponents/player.ts`
    - Define player state, color, and piece list.
4. `src/bot/evaluation.ts`
    - Define the bot evaluation function.
5. `src/bot/search.ts`
    - Implement the search algorithm (minimax / alpha-beta).
6. `src/bot/bitboardUtils.ts`
    - Implement bitboard bitwise operations and helper masks.

## 2. Moving Mechanics

### 2.1 Board Representation

Use a 64-bit bitboard for occupancy. In TypeScript, use `bigint`.

```ts
const A1 = 1n << 0n;
const H8 = 1n << 63n;

function bit(index: number): bigint {
	return 1n << BigInt(index);
}
```

A bitboard uses one bit per square. The least significant bit is `a1`, and the most significant bit is `h8`.

### 2.2 Sliding and Leaping Moves

- Sliding pieces: rook, bishop, queen.
- Leaping pieces: knight, king.

Implement movement generation with bitwise operations.

```ts
function rookMoves(square: number, occupancy: bigint): bigint {
	// Use precomputed rank/file rays or simple sliding loops.
	let moves = 0n;
	const directions = [1, -1, 8, -8];
	for (const direction of directions) {
		let target = square + direction;
		while (
			target >= 0 &&
			target < 64 &&
			sameLine(square, target, direction)
		) {
			moves |= bit(target);
			if (occupancy & bit(target)) break;
			target += direction;
		}
	}
	return moves;
}
```

### 2.3 Move Validation

For each piece type, compute legal destination squares and then test if the specific target square is included.

```ts
function isLegalKnightMove(
	from: number,
	to: number,
	ownPieces: bigint,
): boolean {
	const knightPattern = knightAttacks(from);
	return Boolean(knightPattern & bit(to)) && !(ownPieces & bit(to));
}
```

### 2.4 Executing Moves

Execute a move by updating piece occupancy and board occupancy bitboards.

```ts
function movePiece(board: ChessBoard, from: number, to: number): void {
	const fromMask = bit(from);
	const toMask = bit(to);

	board.occupancy &= ~fromMask;
	board.occupancy |= toMask;
}
```

## 3. Capturing Mechanics

Capturing is a move where a piece lands on a square occupied by an opponent piece.

### 3.1 Capture Detection

Use bitboard intersection to detect captures.

```ts
function isCapture(moveTo: number, enemyPieces: bigint): boolean {
	return Boolean(enemyPieces & bit(moveTo));
}
```

### 3.2 Capturing Execution

When capture occurs:

- Remove the captured piece from its bitboard.
- Move the attacker piece to the destination square.
- Update occupancy.

```ts
function executeCapture(
	board: ChessBoard,
	from: number,
	to: number,
	attacker: Piece,
): void {
	const targetMask = bit(to);
	board.removePieceAt(to);
	movePiece(board, from, to);
	attacker.position = to;
}
```

### 3.3 En Passant Capture

`en passant` is a special pawn capture. It depends on the previous move and is only legal immediately after a two-square pawn advance.

```ts
interface EnPassantState {
	targetSquare: number | null;
}

function canCaptureEnPassant(
	pawnSquare: number,
	enemyPawnSquare: number,
	enPassantTarget: number | null,
): boolean {
	return (
		enPassantTarget !== null &&
		bit(enPassantTarget) === bit(enemyPawnSquare)
	);
}
```

## 4. Castling, En Passant, and Promotion

### 4.1 Castling

Castling moves the king two squares toward a rook and moves the rook to the square the king crossed.

```ts
interface CastlingRights {
	whiteKingSide: boolean;
	whiteQueenSide: boolean;
	blackKingSide: boolean;
	blackQueenSide: boolean;
}
```

Rules:

- King and rook must not have moved.
- No square crossed by the king may be under attack.
- No pieces between king and rook.
- King cannot be in check before or after castling.

### 4.1.1 Castling Validation

```ts
function canCastleKingSide(board: ChessBoard, color: boolean): boolean {
	const rookSquare = color ? 7 : 63; // h1 or h8
	const kingSquare = color ? 4 : 60; // e1 or e8
	const pathMask = color ? bit(5) | bit(6) : bit(61) | bit(62);
	return (
		board.castlingRights[color ? "whiteKingSide" : "blackKingSide"] &&
		!(board.occupancy & pathMask) &&
		!isSquareAttacked(board, kingSquare, !color) &&
		!isSquareAttacked(board, kingSquare + 1, !color)
	);
}
```

### 4.2 En Passant

En passant capture occurs when an opposing pawn moves two squares and lands adjacent to your pawn.

```ts
function handlePawnDoubleStep(
	board: ChessBoard,
	from: number,
	to: number,
): void {
	if (Math.abs(to - from) === 16) {
		board.enPassantTarget = (from + to) / 2;
	} else {
		board.enPassantTarget = null;
	}
}
```

### 4.3 Promotion

When a pawn reaches the last rank, it is promoted into another piece, usually a queen.

```ts
function promotePawn(
	board: ChessBoard,
	from: number,
	to: number,
	promotionPiece: "q" | "r" | "b" | "n",
): void {
	board.removePawn(from);
	board.addPiece(to, promotionPiece, board.activeColor);
}
```

Promotion must be handled by move generation and move execution.

## 5. Blocking Pieces Mechanics

Blocking determines whether a sliding piece can reach a target square.

### 5.1 Occupancy and Ray Attacks

Use occupancy to stop sliding rays.

```ts
function rayMoves(
	square: number,
	direction: number,
	occupancy: bigint,
): bigint {
	let moves = 0n;
	let target = square + direction;

	while (target >= 0 && target < 64 && onSameRay(square, target, direction)) {
		moves |= bit(target);
		if (occupancy & bit(target)) break;
		target += direction;
	}

	return moves;
}
```

### 5.2 Blockers

A blocker is any piece on the ray between attacker and target.

```ts
function isBlocked(from: number, to: number, occupancy: bigint): boolean {
	const betweenMask = squaresBetween(from, to);
	return Boolean(betweenMask & occupancy);
}
```

### 5.3 Sliding Direction Tests

If a rook or bishop is blocked, the move is illegal.

```ts
function isLegalSlidingMove(
	from: number,
	to: number,
	occupancy: bigint,
	attackMask: bigint,
): boolean {
	return Boolean(attackMask & bit(to)) && !isBlocked(from, to, occupancy);
}
```

## 6. The Bot's Evaluation

The evaluation function scores a board position from the bot's perspective.

### 6.1 Material Value

Assign values to pieces.

```ts
const pieceValues: Record<string, number> = {
	p: 100,
	n: 320,
	b: 330,
	r: 500,
	q: 900,
	k: 20000,
};
```

### 6.2 Positional Value

Use piece-square tables to reward good placement.

```ts
const pawnTable: number[] = [
	0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5,
	// ... more ranks
];
```

### 6.3 Evaluation Function

Combine material, position, mobility, king safety, and pawn structure.

```ts
function evaluateBoard(board: ChessBoard): number {
	let score = 0;

	score += evaluateMaterial(board);
	score += evaluateMobility(board);
	score += evaluateKingSafety(board);
	score += evaluatePawnStructure(board);

	return board.sideToMove === "white" ? score : -score;
}
```

### 6.4 Search and Decision Making

Implement minimax with alpha-beta pruning.

```ts
function minimax(
	board: ChessBoard,
	depth: number,
	alpha: number,
	beta: number,
	maximizingPlayer: boolean,
): number {
	if (depth === 0 || board.isGameOver()) {
		return evaluateBoard(board);
	}

	const legalMoves = board.generateMoves();
	if (maximizingPlayer) {
		let value = -Infinity;
		for (const move of legalMoves) {
			board.makeMove(move);
			value = Math.max(
				value,
				minimax(board, depth - 1, alpha, beta, false),
			);
			board.unmakeMove(move);
			alpha = Math.max(alpha, value);
			if (alpha >= beta) break;
		}
		return value;
	}

	let value = Infinity;
	for (const move of legalMoves) {
		board.makeMove(move);
		value = Math.min(value, minimax(board, depth - 1, alpha, beta, true));
		board.unmakeMove(move);
		beta = Math.min(beta, value);
		if (alpha >= beta) break;
	}
	return value;
}
```

## 7. Using Bitboards - Math Logic and Bitwise Operations

A bitboard is a 64-bit integer where each bit maps to one board square.

### 7.1 Bitboard Basics

```ts
const emptyBoard = 0n;
const a1 = 1n << 0n;
const b1 = 1n << 1n;
```

### 7.2 Common Bitwise Operations

- `|` to combine bitboards
- `&` to intersect
- `^` to toggle bits
- `~` to invert
- `<<` and `>>` to shift

```ts
const occupied = whitePawns | blackPawns;
const intersection = whitePawns & blackPawns; // should be 0n
const rookPotential = rankMask | fileMask;
```

### 7.3 Shift-Based Move Generation

Knights and king moves are often generated with bit offsets.

```ts
function knightAttacks(square: number): bigint {
	const mask = bit(square);
	const noAFile = ~0x0101010101010101n;
	const noHFile = ~0x8080808080808080n;

	let moves = 0n;
	moves |= (mask << 17n) & noAFile;
	moves |= (mask << 15n) & noHFile;
	moves |= (mask << 10n) & (noAFile & noAFile);
	moves |= (mask << 6n) & (noHFile & noHFile);
	moves |= (mask >> 17n) & noHFile;
	moves |= (mask >> 15n) & noAFile;
	moves |= (mask >> 10n) & (noHFile & noHFile);
	moves |= (mask >> 6n) & (noAFile & noAFile);

	return moves;
}
```

### 7.4 Attack Masks and Move Masks

Precompute static masks for ranks, files, diagonals and piece attacks.

```ts
const rank1 = 0xffn;
const fileA = 0x0101010101010101n;

function fileMask(file: number): bigint {
	return fileA << BigInt(file);
}
```

### 7.5 Between and Line Functions

Compute all squares between two positions on the same line.

```ts
function squaresBetween(from: number, to: number): bigint {
	// Precomputed or dynamic between-mask generation.
	return betweenLookup[from][to];
}
```

## 8. Implementation Plan

### 8.1 Step 1: Define Board and Piece Models

- Create `ChessBoard` with occupancy bitboards.
- Create base `Piece` class and derived classes for each piece.
- Add quick access methods such as `getPieceAt(square)` and `setPieceAt(square, piece)`.

### 8.2 Step 2: Implement Bitboard Utilities

- Add helper functions for `bit()`, `lsbIndex()`, `popCount()`.
- Add masks for ranks, files, diagonals.
- Add move-generation helpers for knights and kings.

### 8.3 Step 3: Generate Moves for Each Piece Type

- Pawn: forward moves, captures, en passant, promotion.
- Knight: eight leaps.
- Bishop: diagonal sliding.
- Rook: rank/file sliding.
- Queen: combined bishop+rook.
- King: single-step moves and castling.

### 8.4 Step 4: Add Move Validation and Execution

- Check occupancy and blocking for sliding moves.
- Validate capture and non-capture destinations.
- Execute moves by updating the relevant bitboards.
- Preserve history for undo/redo.

### 8.5 Step 5: Special Moves

- Castling: validate rights, path clearance, and attack squares.
- En passant: track target square and execute the capture.
- Promotion: replace pawn with chosen promoted piece.

### 8.6 Step 6: Implement Game State and Rules

- Track side to move, castling rights, en passant square, halfmove clock, fullmove number.
- Detect check, checkmate, stalemate, and draw conditions.

### 8.7 Step 7: Build the Bot Evaluation

- Implement `evaluateBoard`.
- Add material scoring.
- Add positional scoring.
- Add mobility and king safety heuristics.

### 8.8 Step 8: Add Search Algorithm

- Implement minimax or alpha-beta search.
- Add move ordering and quiescence search later.
- Use the evaluation function at leaf nodes.

### 8.9 Step 9: Test and Refine

- Write unit tests for move generation and special rules.
- Test sample positions for en passant, castling and promotion.
- Verify bitboard operations with known patterns.

## 9. Additional Notes

- Use `bigint` everywhere for bitboards.
- Keep move generation separate from move execution.
- Use arrays or maps for piece-square tables.
- Keep a move history stack for `unmakeMove`.
- Prefer immutable bitboard calculations for safety.

## 10. Example TypeScript Class Skeleton

```ts
export class ChessBoard {
	sideToMove: "white" | "black";
	whitePawns = 0x000000000000ff00n;
	blackPawns = 0x00ff000000000000n;
	whitePieces = 0x00000000000000ffn;
	blackPieces = 0xff00000000000000n;
	occupancy = 0n;
	castlingRights = {
		whiteKingSide: true,
		whiteQueenSide: true,
		blackKingSide: true,
		blackQueenSide: true,
	};
	enPassantTarget: number | null = null;

	constructor() {
		this.sideToMove = "white";
		this.occupancy = this.setupBoard();
	}

	setupBoard(): bigint {
		return (
			this.whitePawns |
			this.blackPawns |
			this.whitePieces |
			this.blackPieces
		);
	}
}
```

This plan gives a complete roadmap, explains the core mechanics, and includes TypeScript-style examples for the key concepts required to implement a strong chess bot.
