import { Command } from 'commander';
import { MinesweeperGenerator } from './index';

const program = new Command();

program
    .name('github-contribution-minesweeper')
    .description('🎮💣 Generate a minesweeper animation from your GitHub contributions')
    .version('1.0.0');

program
    .requiredOption('-u, --username <username>', 'GitHub username')
    .requiredOption('-t, --token <token>', 'GitHub personal access token')
    .option('-o, --output <path>', 'Output directory', './dist')
    .option('--strategy <type>', 'Mine placement: top-contributors, all-contributions, percentage', 'top-contributors')
    .option('-m, --mine-percentage <number>', 'Percentage of active cells to be mines (for percentage strategy)', '0.15')
    .option('-s, --speed <number>', 'Animation speed in ms', '100')
    .option('--color-mine <hex>', 'Color for mines')
    .option('--color-flag <hex>', 'Color for flags')
    .option('--color-revealed <hex>', 'Color for revealed cells')
    .option('--color-hidden <hex>', 'Color for hidden cells');

program.parse();

const options = program.opts();

async function main() {
    console.log('');
    console.log('🎮💣 GitHub Contribution Minesweeper');
    console.log('=====================================');
    console.log('');

    try {
        const generator = new MinesweeperGenerator({
            username: options.username,
            token: options.token,
            outputPath: options.output,
            mineStrategy: options.strategy,
            minePercentage: parseFloat(options.minePercentage),
            animationSpeed: parseInt(options.speed),
            colors: {
                ...(options.colorMine && { mine: options.colorMine }),
                ...(options.colorFlag && { flag: options.colorFlag }),
                ...(options.colorRevealed && { revealed: options.colorRevealed }),
                ...(options.colorHidden && { hidden: options.colorHidden }),
            },
        });

        const result = await generator.generate();

        console.log('');
        console.log('📊 Generation Stats:');
        console.log(`   Board: ${result.stats.boardSize}`);
        console.log(`   Mines: ${result.stats.totalMines}`);
        console.log(`   Moves: ${result.stats.moves}`);
        console.log(`   Won: ${result.stats.isWon ? '✅ Yes' : '❌ No'}`);
        console.log('');
        console.log('🎉 Success! Add this to your README:');
        console.log('');
        console.log(`<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${options.username}/${options.username}/output/minesweeper-dark.svg"/>
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${options.username}/${options.username}/output/minesweeper.svg"/>
  <img alt="Minesweeper" src="https://raw.githubusercontent.com/${options.username}/${options.username}/output/minesweeper.svg"/>
</picture>`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
