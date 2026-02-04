import {
    Board,
    Cell,
    ContributionCalendar,
    MineStrategy
} from './types';
import { ContributionStats } from './contribution-fetcher';

export class BoardGenerator {
    private strategy: MineStrategy;
    private minePercentage: number;

    constructor(strategy: MineStrategy = 'top-contributors', minePercentage: number = 0.15) {
        this.strategy = strategy;
        this.minePercentage = Math.min(Math.max(minePercentage, 0.05), 0.50);
    }

    /**
     * Generate a Minesweeper board from contribution data
     */
    generateBoard(
        calendar: ContributionCalendar,
        stats: ContributionStats
    ): Board {
        const cells = this.createGridFromCalendar(calendar);
        this.placeMines(cells, stats);
        this.calculateAdjacentMines(cells);

        const rows = cells.length;
        const cols = cells[0]?.length || 0;
        const totalMines = cells.flat().filter(c => c.isMine).length;

        return {
            cells,
            rows,
            cols,
            totalMines,
            totalCells: rows * cols,
        };
    }

    /**
     * Create initial grid of cells from contribution calendar
     */
    private createGridFromCalendar(calendar: ContributionCalendar): Cell[][] {
        const cells: Cell[][] = [];
        const numWeeks = calendar.weeks.length;

        for (let row = 0; row < 7; row++) {
            cells.push([]);
            for (let col = 0; col < numWeeks; col++) {
                const week = calendar.weeks[col];
                const day = week?.contributionDays[row];

                cells[row].push({
                    row,
                    col,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    contributionCount: day?.contributionCount || 0,
                    date: day?.date || '',
                });
            }
        }

        return cells;
    }

    /**
     * Place mines based on the selected strategy
     */
    private placeMines(cells: Cell[][], stats: ContributionStats): void {
        const allCells = cells.flat();
        const activeCells = allCells.filter(c => c.contributionCount > 0);

        switch (this.strategy) {
            case 'all-contributions':
                // Every contribution day is a mine
                for (const cell of activeCells) {
                    cells[cell.row][cell.col].isMine = true;
                }
                break;

            case 'top-contributors':
                // Top 15-20% most active days become mines
                this.placeTopContributorMines(cells, activeCells);
                break;

            case 'percentage':
            default:
                // Custom percentage of active days
                this.placePercentageMines(cells, activeCells);
                break;
        }
    }

    /**
     * Place mines on the most active days (top contributors)
     */
    private placeTopContributorMines(cells: Cell[][], activeCells: Cell[]): void {
        // Sort by contribution count (descending)
        const sorted = [...activeCells].sort(
            (a, b) => b.contributionCount - a.contributionCount
        );

        // Take top 15-20%
        const numMines = Math.max(
            Math.floor(activeCells.length * 0.18),
            Math.min(15, activeCells.length)
        );

        for (let i = 0; i < numMines && i < sorted.length; i++) {
            const cell = sorted[i];
            cells[cell.row][cell.col].isMine = true;
        }
    }

    /**
     * Place mines based on configured percentage
     */
    private placePercentageMines(cells: Cell[][], activeCells: Cell[]): void {
        const sorted = [...activeCells].sort(
            (a, b) => b.contributionCount - a.contributionCount
        );

        const numMines = Math.max(
            Math.floor(activeCells.length * this.minePercentage),
            Math.min(10, activeCells.length)
        );

        for (let i = 0; i < numMines && i < sorted.length; i++) {
            const cell = sorted[i];
            cells[cell.row][cell.col].isMine = true;
        }
    }

    /**
     * Calculate the number of adjacent mines for each cell
     */
    private calculateAdjacentMines(cells: Cell[][]): void {
        const rows = cells.length;
        const cols = cells[0]?.length || 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (cells[row][col].isMine) continue;

                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;

                        const newRow = row + dr;
                        const newCol = col + dc;

                        if (
                            newRow >= 0 && newRow < rows &&
                            newCol >= 0 && newCol < cols &&
                            cells[newRow][newCol].isMine
                        ) {
                            count++;
                        }
                    }
                }

                cells[row][col].adjacentMines = count;
            }
        }
    }

    /**
     * Get a string representation of the board
     */
    boardToString(board: Board): string {
        let result = '';

        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const cell = board.cells[row][col];

                if (cell.isMine) {
                    result += '💣';
                } else if (cell.adjacentMines > 0) {
                    result += cell.adjacentMines.toString();
                } else if (cell.contributionCount > 0) {
                    result += '·';
                } else {
                    result += ' ';
                }
            }
            result += '\n';
        }

        return result;
    }
}
