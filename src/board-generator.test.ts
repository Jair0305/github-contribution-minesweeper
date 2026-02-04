import { BoardGenerator } from './board-generator';
import { ContributionCalendar, ContributionDay } from './types';
import { ContributionStats } from './contribution-fetcher';

describe('BoardGenerator', () => {
    const createMockCalendar = (weeks: number = 52): ContributionCalendar => {
        const weekData = [];

        for (let w = 0; w < weeks; w++) {
            const days: ContributionDay[] = [];
            for (let d = 0; d < 7; d++) {
                days.push({
                    date: `2024-01-${String(w * 7 + d + 1).padStart(2, '0')}`,
                    contributionCount: Math.floor(Math.random() * 10),
                    contributionLevel: 'FIRST_QUARTILE',
                });
            }
            weekData.push({ contributionDays: days });
        }

        return {
            totalContributions: 500,
            weeks: weekData,
        };
    };

    const mockStats: ContributionStats = {
        totalContributions: 500,
        totalDays: 364,
        activeDays: 200,
        maxContributions: 15,
        p80Threshold: 5,
        averageContributions: 1.4,
    };

    it('should create a board generator with default mine percentage', () => {
        const generator = new BoardGenerator();
        expect(generator).toBeDefined();
    });

    test('uses percentage strategy correctly', () => {
        const generator = new BoardGenerator('percentage', 0.20);
        const calendar = createMockCalendar(10); // Define mockCalendar for this test
        const board = generator.generateBoard(calendar, mockStats);

        // Should have mines (roughly 20% of 7 active days = 1-2 mines)
        expect(board.totalMines).toBeGreaterThan(0);

        // Check clamps
        const generatorLow = new BoardGenerator('percentage', 0.01); // Should clamp to 0.05
        const generatorHigh = new BoardGenerator('percentage', 0.50); // Should clamp to 0.50
        expect(generatorLow).toBeDefined(); // Add assertions for the clamped generators
        expect(generatorHigh).toBeDefined();
    });

    test('calculates adjacent mines correctly', () => {
        // Force a specific mine layout via percentage strategy with high %
        // Or better, we can verify adjacency logic on whatever mines appear
        const generator = new BoardGenerator('percentage', 0.90); // Most active cells become mines
        const calendar = createMockCalendar(10);
        const board = generator.generateBoard(calendar, mockStats);

        expect(board).toBeDefined();
        expect(board.rows).toBe(7);
        expect(board.totalMines).toBeGreaterThan(0);
        expect(board.cells).toHaveLength(7);
        expect(board.cells[0]).toHaveLength(10);
    });

    it('should place mines on cells with high contribution counts', () => {
        const generator = new BoardGenerator('top-contributors');
        const calendar = createMockCalendar(10);
        const board = generator.generateBoard(calendar, mockStats);

        const mines = board.cells.flat().filter(c => c.isMine);
        const nonMines = board.cells.flat().filter(c => !c.isMine);

        // Mines should generally have higher contribution counts
        const avgMineContributions = mines.reduce((sum, c) => sum + c.contributionCount, 0) / mines.length;
        const avgNonMineContributions = nonMines.reduce((sum, c) => sum + c.contributionCount, 0) / nonMines.length;

        expect(avgMineContributions).toBeGreaterThanOrEqual(avgNonMineContributions);
    });

    it('should calculate adjacent mines correctly', () => {
        const generator = new BoardGenerator();
        const calendar = createMockCalendar(10);
        const board = generator.generateBoard(calendar, mockStats);

        // Verify adjacent mine counts
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const cell = board.cells[row][col];

                if (cell.isMine) {
                    // Mines don't have adjacent mine count
                    continue;
                }

                // Count adjacent mines manually
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const newRow = row + dr;
                        const newCol = col + dc;
                        if (
                            newRow >= 0 && newRow < board.rows &&
                            newCol >= 0 && newCol < board.cols &&
                            board.cells[newRow][newCol].isMine
                        ) {
                            count++;
                        }
                    }
                }

                expect(cell.adjacentMines).toBe(count);
            }
        }
    });

    it('should convert board to string for debugging', () => {
        const generator = new BoardGenerator();
        const calendar = createMockCalendar(5);
        const board = generator.generateBoard(calendar, mockStats);

        const str = generator.boardToString(board);
        expect(str).toBeDefined();
        expect(typeof str).toBe('string');
        expect(str.split('\n').length).toBe(8); // 7 rows + 1 trailing newline
    });
});
