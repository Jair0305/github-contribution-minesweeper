import { BoardGenerator } from './board-generator';
import { MinesweeperSolver } from './solver';
import { SVGRenderer } from './svg-renderer';
import { ContributionCalendar, ContributionDay, ContributionLevel } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Generate mock contribution data (simulating a year of contributions)
function generateMockContributions(): ContributionCalendar {
    const weeks: { contributionDays: ContributionDay[] }[] = [];
    const levels: ContributionLevel[] = [
        'NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'
    ];

    let totalContributions = 0;
    const startDate = new Date('2025-01-01');

    for (let week = 0; week < 52; week++) {
        const days: ContributionDay[] = [];

        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + week * 7 + day);

            // Generate random contributions with some patterns
            // Weekends have fewer contributions
            const isWeekend = day === 0 || day === 6;
            const baseChance = isWeekend ? 0.3 : 0.7;

            let count = 0;
            if (Math.random() < baseChance) {
                // Simulate contribution distribution
                const rand = Math.random();
                if (rand < 0.4) count = Math.floor(Math.random() * 3) + 1;      // 1-3
                else if (rand < 0.7) count = Math.floor(Math.random() * 5) + 3;  // 3-7
                else if (rand < 0.9) count = Math.floor(Math.random() * 8) + 5;  // 5-12
                else count = Math.floor(Math.random() * 10) + 10;                // 10-20
            }

            totalContributions += count;

            // Determine level based on count
            let level: ContributionLevel = 'NONE';
            if (count > 0) level = 'FIRST_QUARTILE';
            if (count >= 3) level = 'SECOND_QUARTILE';
            if (count >= 7) level = 'THIRD_QUARTILE';
            if (count >= 12) level = 'FOURTH_QUARTILE';

            days.push({
                date: currentDate.toISOString().split('T')[0],
                contributionCount: count,
                contributionLevel: level,
            });
        }

        weeks.push({ contributionDays: days });
    }

    return {
        totalContributions,
        weeks,
    };
}

async function main() {
    console.log('');
    console.log('🎮💣 GitHub Contribution Minesweeper - Visual Test');
    console.log('==================================================');
    console.log('');

    // Generate mock data
    console.log('📊 Generating mock contribution data...');
    const calendar = generateMockContributions();
    console.log(`   Total contributions: ${calendar.totalContributions}`);
    console.log(`   Weeks: ${calendar.weeks.length}`);

    // Calculate stats
    const stats = {
        totalContributions: calendar.totalContributions,
        totalDays: calendar.weeks.length * 7,
        activeDays: calendar.weeks.flatMap(w => w.contributionDays).filter(d => d.contributionCount > 0).length,
        maxContributions: Math.max(...calendar.weeks.flatMap(w => w.contributionDays.map(d => d.contributionCount))),
        p80Threshold: 5,
        averageContributions: calendar.totalContributions / (calendar.weeks.length * 7),
    };

    console.log(`   Active days: ${stats.activeDays}`);
    console.log(`   Max contributions in a day: ${stats.maxContributions}`);

    // Generate board - using 'all-contributions' strategy for visual test
    console.log('\n💣 Generating minesweeper board...');
    const boardGenerator = new BoardGenerator('all-contributions', 0.15);
    const board = boardGenerator.generateBoard(calendar, stats);
    console.log(`   Board size: ${board.cols}x${board.rows}`);
    console.log(`   Total mines: ${board.totalMines}`);

    // Show board preview
    console.log('\n📋 Board preview:');
    console.log(boardGenerator.boardToString(board));

    // Solve
    console.log('🧠 Solving puzzle...');
    const solver = new MinesweeperSolver(board);
    const gameState = solver.solve();
    console.log(`   Moves: ${gameState.moves.length}`);
    console.log(`   Won: ${gameState.isWon ? '✅ Yes!' : '❌ No'}`);

    // Render SVGs
    console.log('\n🎨 Rendering SVGs...');

    // Ensure output directory exists
    const outputDir = './test-output';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Light mode
    const lightRenderer = new SVGRenderer({ darkMode: false });
    const lightSvg = lightRenderer.render(gameState);
    const lightPath = path.join(outputDir, 'minesweeper-test.svg');
    fs.writeFileSync(lightPath, lightSvg);
    console.log(`   📄 ${lightPath}`);

    // Dark mode
    const darkRenderer = new SVGRenderer({ darkMode: true });
    const darkSvg = darkRenderer.render(gameState);
    const darkPath = path.join(outputDir, 'minesweeper-test-dark.svg');
    fs.writeFileSync(darkPath, darkSvg);
    console.log(`   📄 ${darkPath}`);

    console.log('\n✨ Done! Open the SVG files in your browser to see the result.');
    console.log(`   Light mode: file://${path.resolve(lightPath)}`);
    console.log(`   Dark mode:  file://${path.resolve(darkPath)}`);
    console.log('');
}

main().catch(console.error);
