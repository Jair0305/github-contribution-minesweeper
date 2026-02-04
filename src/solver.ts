import { Board, Cell, Move, GameState } from './types';

export class MinesweeperSolver {
    private board: Board;
    private moves: Move[] = [];
    private revealedCells: Set<string> = new Set();
    private flaggedCells: Set<string> = new Set();
    private startTime: number = 0;

    constructor(board: Board) {
        this.board = this.cloneBoard(board);
    }

    /**
     * Solve the board and return all moves made
     */
    solve(): GameState {
        this.startTime = Date.now();
        this.moves = [];
        this.revealedCells.clear();
        this.flaggedCells.clear();

        // Start by revealing a safe cell (one with 0 adjacent mines if possible)
        const safeStart = this.findSafeStartingCell();
        if (safeStart) {
            this.revealCell(safeStart.row, safeStart.col);
        }

        // Keep solving until we can't make progress
        let madeProgress = true;
        while (madeProgress && !this.isWon() && !this.isLost()) {
            madeProgress = false;

            // Strategy 1: Flag obvious mines
            if (this.flagObviousMines()) {
                madeProgress = true;
            }

            // Strategy 2: Reveal safe cells
            if (this.revealSafeCells()) {
                madeProgress = true;
            }

            // Strategy 3: If stuck, reveal the lowest risk unknown cell
            if (!madeProgress && !this.isWon() && !this.isLost()) {
                const riskyCell = this.findLowestRiskCell();
                if (riskyCell) {
                    this.revealCell(riskyCell.row, riskyCell.col);
                    madeProgress = true;
                }
            }
        }

        console.log(`[Solver] Loop finished. Lost: ${this.isLost()}, Won: ${this.isWon()}`);

        // Final cleanup: reveal any remaining safe cells AND flag remaining mines
        // This ensures visual completeness (counters at zero, all numbers shown)
        if (!this.isLost()) {
            this.finalizeBoard();
        }

        return {
            board: this.board,
            isWon: this.isWon(),
            isLost: this.isLost(),
            revealedCells: this.revealedCells.size,
            flaggedCells: this.flaggedCells.size,
            moves: this.moves,
        };
    }

    /**
     * Find a safe cell to start (preferably one with 0 adjacent mines)
     */
    private findSafeStartingCell(): Cell | null {
        const cells = this.board.cells.flat();

        // First, try to find a cell with 0 adjacent mines and no contribution
        const emptyCell = cells.find(
            c => !c.isMine && c.adjacentMines === 0 && c.contributionCount === 0
        );
        if (emptyCell) return emptyCell;

        // Then, try any cell with 0 adjacent mines
        const zeroCell = cells.find(c => !c.isMine && c.adjacentMines === 0);
        if (zeroCell) return zeroCell;

        // Finally, just find any non-mine cell
        return cells.find(c => !c.isMine) || null;
    }

    /**
     * Reveal a cell and cascade if it's empty
     */
    private revealCell(row: number, col: number): void {
        const key = `${row},${col}`;
        if (this.revealedCells.has(key) || this.flaggedCells.has(key)) {
            return;
        }

        const cell = this.board.cells[row]?.[col];
        if (!cell) return;

        cell.isRevealed = true;
        this.revealedCells.add(key);

        this.moves.push({
            type: 'reveal',
            row,
            col,
            timestamp: Date.now() - this.startTime,
        });

        // If it's an empty cell, cascade reveal adjacent cells
        if (!cell.isMine && cell.adjacentMines === 0) {
            this.cascadeReveal(row, col);
        }
    }

    /**
     * Cascade reveal for empty cells
     */
    private cascadeReveal(row: number, col: number): void {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;

                if (
                    newRow >= 0 && newRow < this.board.rows &&
                    newCol >= 0 && newCol < this.board.cols &&
                    !this.revealedCells.has(key) &&
                    !this.flaggedCells.has(key)
                ) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }

    /**
     * Flag a cell as a mine
     */
    private flagCell(row: number, col: number): void {
        const key = `${row},${col}`;
        if (this.revealedCells.has(key) || this.flaggedCells.has(key)) {
            return;
        }

        const cell = this.board.cells[row]?.[col];
        if (!cell) return;

        cell.isFlagged = true;
        this.flaggedCells.add(key);

        this.moves.push({
            type: 'flag',
            row,
            col,
            timestamp: Date.now() - this.startTime,
        });
    }

    /**
     * Flag cells that are definitely mines
     */
    private flagObviousMines(): boolean {
        let flagged = false;

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const cell = this.board.cells[row][col];

                if (!cell.isRevealed || cell.adjacentMines === 0) continue;

                const neighbors = this.getNeighbors(row, col);
                const hiddenNeighbors = neighbors.filter(
                    n => !n.isRevealed && !n.isFlagged
                );
                const flaggedNeighbors = neighbors.filter(n => n.isFlagged);

                // If remaining hidden cells equals remaining mines, flag them all
                if (
                    hiddenNeighbors.length > 0 &&
                    hiddenNeighbors.length === cell.adjacentMines - flaggedNeighbors.length
                ) {
                    for (const neighbor of hiddenNeighbors) {
                        this.flagCell(neighbor.row, neighbor.col);
                        flagged = true;
                    }
                }
            }
        }

        return flagged;
    }

    /**
     * Reveal cells that are definitely safe
     */
    private revealSafeCells(): boolean {
        let revealed = false;

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const cell = this.board.cells[row][col];

                if (!cell.isRevealed || cell.adjacentMines === 0) continue;

                const neighbors = this.getNeighbors(row, col);
                const flaggedNeighbors = neighbors.filter(n => n.isFlagged);
                const hiddenNeighbors = neighbors.filter(
                    n => !n.isRevealed && !n.isFlagged
                );

                // If all mines are flagged, reveal remaining hidden cells
                if (
                    flaggedNeighbors.length === cell.adjacentMines &&
                    hiddenNeighbors.length > 0
                ) {
                    for (const neighbor of hiddenNeighbors) {
                        this.revealCell(neighbor.row, neighbor.col);
                        revealed = true;
                    }
                }
            }
        }

        return revealed;
    }

    /**
     * Find the cell with lowest risk of being a mine
     */
    private findLowestRiskCell(): Cell | null {
        const cells = this.board.cells.flat();
        const hiddenCells = cells.filter(c => !c.isRevealed && !c.isFlagged);

        if (hiddenCells.length === 0) return null;

        // Prefer cells with lower contribution counts (less likely to be mines)
        hiddenCells.sort((a, b) => a.contributionCount - b.contributionCount);

        return hiddenCells[0];
    }

    /**
     * Get all 8 neighbors of a cell
     */
    private getNeighbors(row: number, col: number): Cell[] {
        const neighbors: Cell[] = [];

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const newRow = row + dr;
                const newCol = col + dc;

                if (
                    newRow >= 0 && newRow < this.board.rows &&
                    newCol >= 0 && newCol < this.board.cols
                ) {
                    neighbors.push(this.board.cells[newRow][newCol]);
                }
            }
        }

        return neighbors;
    }

    /**
     * Check if the game is won
     */
    private isWon(): boolean {
        const cells = this.board.cells.flat();
        const nonMineCells = cells.filter(c => !c.isMine);
        return nonMineCells.every(c => c.isRevealed);
    }

    /**
     * Check if the game is lost (hit a mine)
     */
    private isLost(): boolean {
        return this.board.cells.flat().some(c => c.isMine && c.isRevealed);
    }

    /**
     * Clone a board for solving
     */
    private cloneBoard(board: Board): Board {
        return {
            ...board,
            cells: board.cells.map(row =>
                row.map(cell => ({ ...cell }))
            ),
        };
    }

    /**
     * Finalize the board state after solving (or stopping)
     * Ensures all safe cells are revealed and all mines are flagged
     */
    private finalizeBoard(): void {
        const cells = this.board.cells.flat();

        // 1. Reveal all remaining safe cells (fix for "missing numbers")
        const safeHiddenCells = cells.filter(c => !c.isMine && !c.isRevealed && !c.isFlagged);
        if (safeHiddenCells.length > 0) {
            console.log(`[Solver] Finalizing: Revealing ${safeHiddenCells.length} remaining safe cells.`);
            for (const cell of safeHiddenCells) {
                this.revealCell(cell.row, cell.col);
            }
        }

        // 2. Flag all remaining mines (fix for "counter not zero")
        const unflaggedMines = cells.filter(c => c.isMine && !c.isFlagged);
        if (unflaggedMines.length > 0) {
            console.log(`[Solver] Finalizing: Flagging ${unflaggedMines.length} remaining mines to zero counters.`);
            for (const cell of unflaggedMines) {
                // We use flagCell to record the move so the counter animates
                this.flagCell(cell.row, cell.col);
            }
        }
    }
}
