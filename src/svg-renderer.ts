/**
 * SVG Renderer (Infinite Loop Version)
 * 
 * Generates animated SVG that loops perfectly and indefinitely.
 * Uses KeyTimes/Values for all animations relative to a master cycle duration.
 */

import {
  Board,
  GameState,
  Move,
  RenderOptions,
  ColorPalette,
  DEFAULT_COLORS,
  DARK_MODE_COLORS
} from './types';

const DEFAULT_RENDER_OPTIONS: Omit<RenderOptions, 'colors'> & { colors: ColorPalette } = {
  cellSize: 12,
  padding: 10,
  animationSpeed: 100,
  colors: DEFAULT_COLORS,
  showDate: false,
  darkMode: false,
};

export class SVGRenderer {
  private options: Omit<RenderOptions, 'colors'> & { colors: ColorPalette };
  private headerHeight = 32;

  constructor(options: Partial<RenderOptions> = {}) {
    const baseColors = options.darkMode ? DARK_MODE_COLORS : DEFAULT_COLORS;

    this.options = {
      ...DEFAULT_RENDER_OPTIONS,
      ...options,
      colors: {
        ...baseColors,
        ...(options.colors || {}),
      },
    };
  }

  /**
   * Render the complete animated SVG
   */
  render(gameState: GameState): string {
    const { board, moves } = gameState;
    const { cellSize, padding, colors } = this.options;

    const width = board.cols * cellSize + padding * 2;
    const height = board.rows * cellSize + padding * 2 + this.headerHeight;

    const significantMoves = moves.filter(move => {
      const cell = board.cells[move.row]?.[move.col];
      if (!cell) return false;
      return move.type === 'flag' || cell.isMine || cell.adjacentMines > 0;
    });

    const timeline = this.calculateTimeline(significantMoves);

    // Cycle Logic
    const gameDuration = timeline.length > 0
      ? timeline[timeline.length - 1].endTime + 500
      : 2000;
    const pauseDuration = 3000;
    const cycleDuration = gameDuration + pauseDuration;

    // Time scaling factor (0 to 1 represents full cycle)
    const timeScale = gameDuration / cycleDuration; // e.g., 0.8 means game is 80% of cycle

    const styles = this.generateStyles();
    const defs = this.generateDefs();

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" 
     width="${width}" 
     height="${height}">
  <title>GitHub Contribution Minesweeper</title>
  
  <style>${styles}</style>
  <defs>${defs}</defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.background}" rx="4"/>
  
  <!-- Header UI -->
  <g transform="translate(${padding}, ${padding})">
    ${this.renderHeader(width - padding * 2, this.headerHeight - 8, board.totalMines, cycleDuration, timeScale, timeline)}
  </g>
  
  <!-- Game board -->
  <g transform="translate(${padding}, ${padding + this.headerHeight})">
    ${this.renderStaticBoard(board)}
    ${this.renderAnimatedCells(board, timeline, cycleDuration, timeScale)}
  </g>
</svg>`;
  }

  /**
   * Render Header with looped counters
   */
  private renderHeader(width: number, height: number, totalMines: number, cycleDuration: number, timeScale: number, timeline: AnimationEvent[]): string {
    const { darkMode } = this.options;
    const bgColor = darkMode ? '#0d1117' : '#ebedf0';
    const borderColor = darkMode ? '#30363d' : '#d0d7de';

    const faceX = width / 2;
    const faceY = height / 2;
    const faceR = (height - 8) / 2;

    const faceBase = `<circle cx="${faceX}" cy="${faceY}" r="${faceR}" fill="#fbdf4b" stroke="#808080" stroke-width="1"/>`;
    const eyes = `<circle cx="${faceX - 3}" cy="${faceY - 2}" r="1.5" fill="#000"/> <circle cx="${faceX + 3}" cy="${faceY - 2}" r="1.5" fill="#000"/>`;
    const smile = `<path d="M ${faceX - 5} ${faceY + 2} Q ${faceX} ${faceY + 7} ${faceX + 5} ${faceY + 2}" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>`;
    const sunglasses = `<path d="M ${faceX - 6} ${faceY - 3} h 12 v 3 q 0 3 -6 3 q -6 0 -6 -3 z" fill="#000"/> <line x1="${faceX - 6}" y1="${faceY - 3}" x2="${faceX + 6}" y2="${faceY - 3}" stroke="#000" stroke-width="1"/>`;
    const coolSmile = `<path d="M ${faceX - 4} ${faceY + 3} Q ${faceX} ${faceY + 6} ${faceX + 4} ${faceY + 3}" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>`;

    // Counters
    // Mine Counter
    const mineKeyTimes: number[] = [0];
    const mineValues: number[] = [totalMines];
    let currentMines = totalMines;

    [...timeline].sort((a, b) => a.startTime - b.startTime).forEach(event => {
      if (event.move.type === 'flag') {
        const ratio = (event.startTime / cycleDuration); // Correct ratio against full cycle
        if (ratio > 0.001) {
          mineKeyTimes.push(ratio - 0.0001);
          mineValues.push(currentMines);
        }
        currentMines--;
        mineKeyTimes.push(ratio);
        mineValues.push(currentMines);
      }
    });
    mineKeyTimes.push(timeScale); mineValues.push(currentMines);
    mineKeyTimes.push(1); mineValues.push(currentMines);

    // Timer
    const timeKeyTimes: number[] = [0];
    const timeValues: number[] = [0];
    const totalSeconds = Math.floor((cycleDuration * timeScale) / 1000);

    for (let s = 1; s <= totalSeconds; s++) {
      const ratio = (s * 1000) / cycleDuration;
      timeKeyTimes.push(Math.max(0, ratio - 0.0001));
      timeValues.push(s - 1);
      timeKeyTimes.push(ratio);
      timeValues.push(s);
    }
    timeKeyTimes.push(timeScale); timeValues.push(totalSeconds);
    timeKeyTimes.push(1); timeValues.push(totalSeconds);

    const digitStrip = `
        <g id="digits">
            ${Array.from({ length: 10 }, (_, i) => `<text y="${i * 20}" x="0" dy="15">${i}</text>`).join('')}
        </g>
    `;

    const renderAnimatedDigit = (keyTimes: number[], rawValues: number[], digitPlace: number, xOffset: number) => {
      const validKeyTimes: number[] = [];
      const validValues: string[] = [];
      let lastTime = -1;

      for (let i = 0; i < keyTimes.length; i++) {
        let t = keyTimes[i];
        if (t <= lastTime) t = lastTime + 0.00001;
        if (t > 1.0) t = 1.0;
        const rawVal = rawValues[i];
        const v = Math.max(0, rawVal);
        const digit = Math.floor(v / digitPlace) % 10;
        validKeyTimes.push(Number(t.toFixed(5)));
        validValues.push(`${-digit * 20}`);
        lastTime = t;
      }

      return `
            <g transform="translate(${xOffset}, 0)">
                <g>
                    ${digitStrip}
                    <animateTransform attributeName="transform" type="translate" values="0 ${validValues[0]};${validValues.map(v => `0 ${v}`).join(';')}" keyTimes="0;${validKeyTimes.join(';')}" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze" calcMode="discrete"/>
                </g>
            </g>
        `;
    };

    const renderCounter = (x: number, keyTimes: number[], values: number[]) => {
      return `
            <g transform="translate(${x}, 4)">
                <rect width="42" height="${height - 8}" fill="#000"/>
                <svg x="0" y="0" width="42" height="${height - 8}" viewBox="0 0 42 ${height - 8}">
                    <g fill="red" font-family="monospace" font-weight="bold" font-size="20" transform="translate(2, -2)">
                        ${renderAnimatedDigit(keyTimes, values, 100, 0)}
                        ${renderAnimatedDigit(keyTimes, values, 10, 13)}
                        ${renderAnimatedDigit(keyTimes, values, 1, 26)}
                    </g>
                </svg>
            </g>
        `;
    };

    return `
      <rect width="${width}" height="${height}" fill="${bgColor}" stroke="${borderColor}" stroke-width="1" rx="2"/>
      ${renderCounter(5, mineKeyTimes, mineValues)}
      ${renderCounter(width - 47, timeKeyTimes, timeValues)}
      <g>
        ${faceBase}
        <g id="face-playing">
            ${eyes}
            ${smile}
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${timeScale - 0.01};${timeScale};1;1" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
        </g>
        <g id="face-won" opacity="0">
            ${sunglasses}
            ${coolSmile}
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${timeScale - 0.01};${timeScale};1;1" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
        </g>
      </g>
    `;
  }

  private renderAnimatedCells(board: Board, timeline: AnimationEvent[], cycleDuration: number, timeScale: number): string {
    const { cellSize } = this.options;
    let html = '';
    const eventMap = new Map<string, AnimationEvent>();
    for (const event of timeline) eventMap.set(`${event.move.row},${event.move.col}`, event);

    // Safety net delay (just after game ends)
    const lateDelay = timeline.length > 0 ? timeline[timeline.length - 1].endTime : 1000;

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const cell = board.cells[row][col];
        const event = eventMap.get(`${row},${col}`);

        // Determine start time and fade duration
        let startTime = -1;

        if (event) {
          startTime = event.startTime;
        } else if (cell.isRevealed && cell.adjacentMines > 0 && !cell.isMine) {
          // Safety net
          startTime = lateDelay;
        }

        if (startTime >= 0) {
          const x = col * cellSize + 0.5;
          const y = row * cellSize + 0.5;
          const size = cellSize - 1;
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;

          // Calculate KeyTimes for Opacity Loop
          // 0 -> start: Opacity 0
          // start -> start+fade: Opacity 0 to 1
          // start+fade -> endCycle: Opacity 1
          const fadeDur = 80; // ms
          const startRatio = startTime / cycleDuration;
          const endRatio = (startTime + fadeDur) / cycleDuration;

          // Allow 5 decimal places
          const kt = `0;${Math.max(0, startRatio - 0.001).toFixed(5)};${Math.min(1, endRatio).toFixed(5)};1`;
          const val = `0;0;1;1`;

          let content = '';
          if (event && event.move.type === 'flag') {
            const contributionColor = this.getContributionColor(cell.contributionCount);
            const borderColor = this.options.darkMode ? '#30363d' : '#d0d7de';
            content = `
                    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${contributionColor}" stroke="${borderColor}" stroke-width="0.3"/>
                    <use href="#flag" x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}"/>
                `;
          } else if ((event && cell.isMine) || cell.isMine) {
            content = `
                    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" class="cell-mine"/>
                    <use href="#mine" x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}"/>
                `;
          } else {
            content = `
                    <text x="${cx}" y="${cy + 3}" text-anchor="middle" class="num n${cell.adjacentMines}">
                    ${cell.adjacentMines}
                    </text>`;
          }

          html += `
                <g opacity="0">
                    <animate attributeName="opacity" values="${val}" keyTimes="${kt}" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
                    ${content}
                </g>
            `;
        }
      }
    }
    return html;
  }

  private calculateTimeline(moves: Move[]): AnimationEvent[] {
    const events: AnimationEvent[] = [];
    let currentTime = 400;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const prevMove = i > 0 ? moves[i - 1] : null;
      let thinkTime = 60 + Math.random() * 60;
      if (move.type === 'flag') thinkTime += 80 + Math.random() * 80;
      if (prevMove) {
        const dist = Math.sqrt(Math.pow(move.row - prevMove.row, 2) + Math.pow(move.col - prevMove.col, 2));
        thinkTime += dist * 10;
      }
      if (Math.random() < 0.03) thinkTime += 150 + Math.random() * 150;
      currentTime += thinkTime;
      events.push({ move, startTime: currentTime, endTime: currentTime + 60 });
      currentTime += 60;
    }
    return events;
  }

  private generateStyles(): string {
    const { colors } = this.options;
    return `
      .cell-hidden { fill: ${colors.hidden}; stroke: ${colors.border}; stroke-width: 0.5; }
      .cell-number { fill: ${colors.revealed}; stroke: ${colors.border}; stroke-width: 0.3; }
      .cell-mine { fill: ${colors.exploded}; stroke: ${colors.border}; stroke-width: 0.5; }
      .num { font-family: 'Consolas', 'Monaco', monospace; font-weight: bold; font-size: 9px; }
      .n1 { fill: ${colors.number1}; }
      .n2 { fill: ${colors.number2}; }
      .n3 { fill: ${colors.number3}; }
      .n4 { fill: ${colors.number4}; }
      .n5 { fill: ${colors.number5}; }
      .n6 { fill: ${colors.number6}; }
      .n7 { fill: ${colors.number7}; }
      .n8 { fill: ${colors.number8}; }
      .mine-body { fill: #000; }
      .flag-pole { stroke: #333; stroke-width: 1; }
      .flag-cloth { fill: ${colors.mine}; }
      .cursor { fill: none; stroke: ${colors.mine}; stroke-width: 1.5; opacity: 0.8; }
    `;
  }

  private generateDefs(): string {
    return `
      <symbol id="mine" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="2.5" class="mine-body"/>
        <line x1="5" y1="1.5" x2="5" y2="8.5" stroke="#000" stroke-width="0.7"/>
        <line x1="1.5" y1="5" x2="8.5" y2="5" stroke="#000" stroke-width="0.7"/>
        <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" stroke="#000" stroke-width="0.5"/>
        <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" stroke="#000" stroke-width="0.5"/>
      </symbol>
      <symbol id="flag" viewBox="0 0 10 10">
        <line x1="3" y1="2" x2="3" y2="8.5" class="flag-pole"/>
        <polygon points="3,2 8,3.5 3,5" class="flag-cloth"/>
      </symbol>
    `;
  }

  private getContributionColor(count: number): string {
    const isDark = this.options.darkMode;
    const colors = isDark
      ? ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
      : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    if (count >= 10) return colors[4];
    if (count >= 6) return colors[3];
    if (count >= 3) return colors[2];
    if (count > 0) return colors[1];
    return colors[0];
  }

  private renderStaticBoard(board: Board): string {
    const { cellSize } = this.options;
    const isDark = this.options.darkMode;
    let html = '';
    const baseColor = isDark ? '#161b22' : '#ebedf0';
    const borderColor = isDark ? '#30363d' : '#d0d7de';
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const x = col * cellSize + 0.5;
        const y = row * cellSize + 0.5;
        const size = cellSize - 1;
        html += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${baseColor}" stroke="${borderColor}" stroke-width="0.3" id="bg-${row}-${col}"/>`;
      }
    }
    return html;
  }

  private renderCursor(timeline: AnimationEvent[], cellSize: number, padding: number, cycleDuration: number, timeScale: number): string {
    if (timeline.length === 0) return '';

    // Scale all times from gameDuration to cycleDuration
    const posTimes = timeline.map(e => ({
      x: padding + e.move.col * cellSize - 1,
      y: padding + e.move.row * cellSize - 1,
      time: (e.startTime / cycleDuration) // Correct ratio
    }));

    const keyTimes: number[] = [0];
    const xVals: number[] = [posTimes[0].x];
    const yVals: number[] = [posTimes[0].y];

    // Helper adds tiny gaps to simulate "jumps"
    for (const pos of posTimes) {
      // Just before move (hold previous)
      keyTimes.push(Math.max(0.0001, pos.time - 0.0001));
      xVals.push(xVals[xVals.length - 1]);
      yVals.push(yVals[yVals.length - 1]);

      // Move happens instantly (or very fast)
      keyTimes.push(pos.time);
      xVals.push(pos.x);
      yVals.push(pos.y);
    }

    // Hold final position until game ends and disappears
    const endTime = timeScale;
    keyTimes.push(endTime);
    xVals.push(posTimes[posTimes.length - 1].x);
    yVals.push(posTimes[posTimes.length - 1].y);

    // Then ensure it stays there (or disappears) until cycle resets
    keyTimes.push(1);
    xVals.push(posTimes[posTimes.length - 1].x);
    yVals.push(posTimes[posTimes.length - 1].y);

    return `
      <rect class="cursor" width="${cellSize + 2}" height="${cellSize + 2}" rx="2" x="${posTimes[0].x}" y="${posTimes[0].y}">
        <animate attributeName="x" values="${xVals.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
        <animate attributeName="y" values="${yVals.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
        <animate attributeName="opacity" values="0;0.8;0.8;0;0" keyTimes="0;0.01;${endTime - 0.01};${endTime};1" dur="${cycleDuration}ms" repeatCount="indefinite" fill="freeze"/>
      </rect>
    `;
  }

  renderStatic(board: Board): string { return ''; }
}

interface AnimationEvent {
  move: Move;
  startTime: number;
  endTime: number;
}
