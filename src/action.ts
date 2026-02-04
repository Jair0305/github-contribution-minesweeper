import * as core from '@actions/core';
import { MinesweeperGenerator } from './index';
import { MineStrategy } from './types';

async function run(): Promise<void> {
    try {
        // Get inputs from action
        const username = core.getInput('github_user_name', { required: true });
        const token = core.getInput('github_token', { required: true });
        const outputPath = core.getInput('output_path') || 'dist';
        const mineStrategy = (core.getInput('mine_strategy') || 'all-contributions') as MineStrategy;
        const minePercentage = parseFloat(core.getInput('mine_percentage') || '0.15');
        const animationSpeed = parseInt(core.getInput('animation_speed') || '100');

        core.info(`🎮 Generating minesweeper for ${username}`);
        core.info(`📋 Strategy: ${mineStrategy}`);

        const generator = new MinesweeperGenerator({
            username,
            token,
            outputPath,
            mineStrategy,
            minePercentage,
            animationSpeed,
        });

        const result = await generator.generate();

        // Set outputs
        core.setOutput('svg_path', result.files[0]);
        core.setOutput('svg_dark_path', result.files[1]);
        core.setOutput('board_size', result.stats.boardSize);
        core.setOutput('total_mines', result.stats.totalMines);
        core.setOutput('moves', result.stats.moves);
        core.setOutput('is_won', result.stats.isWon);

        core.info(`✅ Successfully generated ${result.files.length} files`);
        core.info(`📊 Board: ${result.stats.boardSize}, Mines: ${result.stats.totalMines}`);

    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unexpected error occurred');
        }
    }
}

run();
