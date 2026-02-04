export interface ContributionDay {
    date: string;
    contributionCount: number;
    contributionLevel: ContributionLevel;
}

export type ContributionLevel =
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
    totalContributions: number;
    weeks: ContributionWeek[];
}

export interface GitHubContributionData {
    user: {
        contributionsCollection: {
            contributionCalendar: ContributionCalendar;
        };
    };
}

// ============================================
// Minesweeper Board Types
// ============================================

export interface Cell {
    row: number;
    col: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
    contributionCount: number;
    date: string;
}

export interface Board {
    cells: Cell[][];
    rows: number;
    cols: number;
    totalMines: number;
    totalCells: number;
}

export interface GameState {
    board: Board;
    isWon: boolean;
    isLost: boolean;
    revealedCells: number;
    flaggedCells: number;
    moves: Move[];
}

// ============================================
// Animation Types
// ============================================

export interface Move {
    type: 'reveal' | 'flag' | 'unflag';
    row: number;
    col: number;
    timestamp: number;
}

export interface AnimationFrame {
    frameIndex: number;
    cells: CellRenderState[];
    duration: number;
}

export interface CellRenderState {
    row: number;
    col: number;
    state: 'hidden' | 'revealed' | 'flagged' | 'exploded';
    content: string; // '', '💣', '🚩', '1'-'8'
}

// ============================================
// SVG Rendering Types
// ============================================

export interface RenderOptions {
    cellSize: number;
    padding: number;
    animationSpeed: number;
    colors: Partial<ColorPalette>;
    showDate: boolean;
    darkMode: boolean;
}

export interface ColorPalette {
    mine: string;
    flag: string;
    hidden: string;
    revealed: string;
    exploded: string;
    number1: string;
    number2: string;
    number3: string;
    number4: string;
    number5: string;
    number6: string;
    number7: string;
    number8: string;
    border: string;
    background: string;
    text: string;
}

// ============================================
// Configuration Types
// ============================================

export interface GeneratorConfig {
    username: string;
    token: string;
    outputPath: string;
    mineStrategy: MineStrategy;
    minePercentage: number; // Used when strategy is 'percentage'
    animationSpeed: number;
    colors: Partial<ColorPalette>;
    darkMode: boolean;
}

/**
 * Strategy for placing mines on the board
 * - 'top-contributors': Only the top X% most active days become mines
 * - 'all-contributions': Every day with at least 1 contribution is a mine
 * - 'percentage': A configurable percentage of active days become mines
 */
export type MineStrategy = 'top-contributors' | 'all-contributions' | 'percentage';

export const DEFAULT_COLORS: ColorPalette = {
    mine: '#D82909',
    flag: '#FCB930',
    hidden: '#C0C0C0',
    revealed: '#E8E8E8',
    exploded: '#FF0000',
    number1: '#0000FF',
    number2: '#008000',
    number3: '#FF0000',
    number4: '#000080',
    number5: '#800000',
    number6: '#008080',
    number7: '#000000',
    number8: '#808080',
    border: '#808080',
    background: '#FFFFFF',
    text: '#000000',
};

export const DARK_MODE_COLORS: ColorPalette = {
    mine: '#EB5121',
    flag: '#FCB930',
    hidden: '#2D2D2D',
    revealed: '#1A1A1A',
    exploded: '#D82909',
    number1: '#5B9BD5',
    number2: '#70AD47',
    number3: '#ED7D31',
    number4: '#4472C4',
    number5: '#C00000',
    number6: '#00B0F0',
    number7: '#FFFFFF',
    number8: '#A6A6A6',
    border: '#404040',
    background: '#0D1117',
    text: '#C9D1D9',
};
