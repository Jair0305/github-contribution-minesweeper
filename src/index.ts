import { ContributionFetcher } from './contribution-fetcher';
import { BoardGenerator } from './board-generator';
import { MinesweeperSolver } from './solver';
import { SVGRenderer } from './svg-renderer';
import { GeneratorConfig, RenderOptions, GameState, Board } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class MinesweeperGenerator {
    private config: GeneratorConfig;
    private fetcher: ContributionFetcher;
    private boardGenerator: BoardGenerator;

    constructor(config: Partial<GeneratorConfig> & { username: string; token: string }) {
        this.config = {
            outputPath: './dist',
            mineStrategy: 'top-contributors',
            minePercentage: 0.15,
            animationSpeed: 100,
            colors: {},
            darkMode: false,
            ...config,
        };

        this.fetcher = new ContributionFetcher(this.config.token);
        this.boardGenerator = new BoardGenerator(this.config.mineStrategy, this.config.minePercentage);
    }

    /**
     * Generate minesweeper SVGs from GitHub contributions
     */
    async generate(): Promise<GenerationResult> {
        console.log(`🎮 Fetching contributions for ${this.config.username}...`);

        // Fetch contribution data
        const calendar = await this.fetcher.fetchContributions(this.config.username);
        const stats = this.fetcher.getContributionStats(calendar);

        console.log(`📊 Found ${stats.totalContributions} contributions across ${stats.totalDays} days`);
        console.log(`🎯 Active days: ${stats.activeDays}, Max contributions: ${stats.maxContributions}`);

        // Generate the board
        console.log(`\n💣 Generating minesweeper board...`);
        const board = this.boardGenerator.generateBoard(calendar, stats);

        console.log(`📐 Board size: ${board.cols}x${board.rows}`);
        console.log(`💥 Total mines: ${board.totalMines}`);

        // Solve the board
        console.log(`\n🧠 Solving the puzzle...`);
        const solver = new MinesweeperSolver(board);
        const gameState = solver.solve();

        console.log(`✅ Solution found!`);
        console.log(`📝 Moves: ${gameState.moves.length}`);
        console.log(`🏆 Won: ${gameState.isWon}`);

        // Render SVGs
        console.log(`\n🎨 Rendering SVGs...`);
        const results = await this.renderAndSave(gameState);

        console.log(`\n✨ Done! Generated ${results.files.length} files`);

        return results;
    }

    /**
     * Render and save SVG files
     */
    private async renderAndSave(gameState: GameState): Promise<GenerationResult> {
        const files: string[] = [];

        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputPath)) {
            fs.mkdirSync(this.config.outputPath, { recursive: true });
        }

        // Light mode SVG
        const lightRenderer = new SVGRenderer({
            animationSpeed: this.config.animationSpeed,
            colors: this.config.colors,
            darkMode: false,
        });
        const lightSvg = lightRenderer.render(gameState);
        const lightPath = path.join(this.config.outputPath, 'minesweeper.svg');
        fs.writeFileSync(lightPath, lightSvg);
        files.push(lightPath);
        console.log(`  📄 ${lightPath}`);

        // Dark mode SVG
        const darkRenderer = new SVGRenderer({
            animationSpeed: this.config.animationSpeed,
            colors: this.config.colors,
            darkMode: true,
        });
        const darkSvg = darkRenderer.render(gameState);
        const darkPath = path.join(this.config.outputPath, 'minesweeper-dark.svg');
        fs.writeFileSync(darkPath, darkSvg);
        files.push(darkPath);
        console.log(`  📄 ${darkPath}`);

        return {
            files,
            stats: {
                totalContributions: gameState.board.totalCells,
                totalMines: gameState.board.totalMines,
                boardSize: `${gameState.board.cols}x${gameState.board.rows}`,
                moves: gameState.moves.length,
                isWon: gameState.isWon,
            },
        };
    }
}

export interface GenerationResult {
    files: string[];
    stats: {
        totalContributions: number;
        totalMines: number;
        boardSize: string;
        moves: number;
        isWon: boolean;
    };
}

// Export all modules
export { ContributionFetcher } from './contribution-fetcher';
export { BoardGenerator } from './board-generator';
export { MinesweeperSolver } from './solver';
export { SVGRenderer } from './svg-renderer';
export * from './types';
