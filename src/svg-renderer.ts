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

    // Filter moves to only include numbers and flags (skip empty reveals)
    const significantMoves = moves.filter(move => {
      const cell = board.cells[move.row]?.[move.col];
      if (!cell) return false;
      // Include: flags, mines, and cells with adjacent mines (numbers)
      return move.type === 'flag' || cell.isMine || cell.adjacentMines > 0;
    });

    const timeline = this.calculateTimeline(significantMoves);
    const totalDuration = timeline.length > 0
      ? timeline[timeline.length - 1].endTime + 1000
      : 2000;

    const styles = this.generateStyles();
    const defs = this.generateDefs();

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" 
     width="${width}" 
     height="${height}">
  <title>GitHub Contribution Minesweeper</title>
  <desc>Minesweeper puzzle from GitHub contributions</desc>
  
  <style>${styles}</style>
  <defs>${defs}</defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.background}" rx="4"/>
  
  <!-- Header UI -->
  <g transform="translate(${padding}, ${padding})">
    ${this.renderHeader(width - padding * 2, this.headerHeight - 8, board.totalMines, totalDuration, timeline)}
  </g>
  
  <!-- Game board -->
  <g transform="translate(${padding}, ${padding + this.headerHeight})">
    ${this.renderStaticBoard(board)}
    ${this.renderAnimatedCells(board, timeline)}
  </g>
  
  <!-- Cursor -->
  <g transform="translate(0, ${this.headerHeight})">
      ${this.renderCursor(timeline, cellSize, padding, totalDuration)}
  </g>
</svg>`;
  }

  /**
   * Render the game header with DATA-DRIVEN counters specific to the gameplay
   * Counters update exactly when events happen, no approximations.
   */
  private renderHeader(width: number, height: number, totalMines: number, duration: number, timeline: AnimationEvent[]): string {
    const { darkMode } = this.options;
    const bgColor = darkMode ? '#0d1117' : '#ebedf0';
    const borderColor = darkMode ? '#30363d' : '#d0d7de';

    // Face Logic
    const faceX = width / 2;
    const faceY = height / 2;
    const faceR = (height - 8) / 2;

    const faceBase = `<circle cx="${faceX}" cy="${faceY}" r="${faceR}" fill="#fbdf4b" stroke="#808080" stroke-width="1"/>`;
    const eyes = `<circle cx="${faceX - 3}" cy="${faceY - 2}" r="1.5" fill="#000"/> <circle cx="${faceX + 3}" cy="${faceY - 2}" r="1.5" fill="#000"/>`;
    const smile = `<path d="M ${faceX - 5} ${faceY + 2} Q ${faceX} ${faceY + 7} ${faceX + 5} ${faceY + 2}" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>`;
    const sunglasses = `<path d="M ${faceX - 6} ${faceY - 3} h 12 v 3 q 0 3 -6 3 q -6 0 -6 -3 z" fill="#000"/> <line x1="${faceX - 6}" y1="${faceY - 3}" x2="${faceX + 6}" y2="${faceY - 3}" stroke="#000" stroke-width="1"/>`;
    const coolSmile = `<path d="M ${faceX - 4} ${faceY + 3} Q ${faceX} ${faceY + 6} ${faceX + 4} ${faceY + 3}" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>`;

    // --- DATA-DRIVEN COUNTER LOGIC ---

    // 1. Generate Mine Counter Keyframes based on FLAG events
    const mineKeyTimes: number[] = [0];
    const mineValues: number[] = [totalMines];

    let currentMines = totalMines;

    // Sort timeline just in case
    const sortedEvents = [...timeline].sort((a, b) => a.startTime - b.startTime);

    for (const event of sortedEvents) {
      if (event.move.type === 'flag') {
        const timeRatio = Math.max(0, Math.min(1, event.startTime / duration));
        // Add keyframe just before change to hold value
        if (timeRatio > 0.001) {
          mineKeyTimes.push(timeRatio - 0.0001);
          mineValues.push(currentMines);
        }
        // Change value
        currentMines--;
        mineKeyTimes.push(timeRatio);
        mineValues.push(currentMines);
      }
    }
    // End keyframe
    mineKeyTimes.push(1);
    mineValues.push(currentMines);

    // 2. Generate Timer Keyframes (Linear seconds)
    const timeKeyTimes: number[] = [0];
    const timeValues: number[] = [0];
    const totalSeconds = Math.floor(duration / 1000);

    for (let s = 1; s <= totalSeconds; s++) {
      const timeRatio = Math.min(1, (s * 1000) / duration);
      if (timeRatio >= 1) break;

      // Hold previous second until just before tick
      timeKeyTimes.push(Math.max(0, timeRatio - 0.0001));
      timeValues.push(s - 1);

      // Tick to next second
      timeKeyTimes.push(timeRatio);
      timeValues.push(s);
    }
    timeKeyTimes.push(1);
    timeValues.push(totalSeconds);

    // 3. Helper to render specific digit strip
    const digitStrip = `
        <g id="digits">
            ${Array.from({ length: 10 }, (_, i) => `<text y="${i * 20}" x="0" dy="15">${i}</text>`).join('')}
        </g>
    `;

    const renderAnimatedDigit = (keyTimes: number[], rawValues: number[], digitPlace: number, animDur: number, xOffset: number) => {
      // Prepare strictly increasing keyTimes for SVG validity
      const validKeyTimes: number[] = [];
      const validValues: string[] = [];

      let lastTime = -1;

      for (let i = 0; i < keyTimes.length; i++) {
        let t = keyTimes[i];
        // Fix close values
        if (t <= lastTime) t = lastTime + 0.00001;
        if (t > 1.0) t = 1.0;

        const rawVal = rawValues[i];
        const v = Math.max(0, rawVal);
        const digit = Math.floor(v / digitPlace) % 10;
        const yOffset = -digit * 20;

        validKeyTimes.push(Number(t.toFixed(5)));
        validValues.push(`${yOffset}`);

        lastTime = t;
      }

      return `
            <g transform="translate(${xOffset}, 0)">
                <g>
                    ${digitStrip}
                    <animateTransform attributeName="transform" type="translate" values="0 ${validValues[0]};${validValues.map(v => `0 ${v}`).join(';')}" keyTimes="0;${validKeyTimes.join(';')}" dur="${animDur}ms" fill="freeze" calcMode="discrete"/>
                </g>
            </g>
        `;
    };

    const renderCounter = (x: number, keyTimes: number[], values: number[], animDur: number) => {
      return `
            <g transform="translate(${x}, 4)">
                <rect width="42" height="${height - 8}" fill="#000"/>
                <svg x="0" y="0" width="42" height="${height - 8}" viewBox="0 0 42 ${height - 8}">
                    <g fill="red" font-family="monospace" font-weight="bold" font-size="20" transform="translate(2, -2)">
                        ${renderAnimatedDigit(keyTimes, values, 100, animDur, 0)}
                        ${renderAnimatedDigit(keyTimes, values, 10, animDur, 13)}
                        ${renderAnimatedDigit(keyTimes, values, 1, animDur, 26)}
                    </g>
                </svg>
            </g>
        `;
    };

    return `
      <!-- Header Background -->
      <rect width="${width}" height="${height}" fill="${bgColor}" stroke="${borderColor}" stroke-width="1" rx="2"/>

      <!-- Mines Counter (Synchronized with Flags) -->
      ${renderCounter(5, mineKeyTimes, mineValues, duration)}

      <!-- Timer (Real Seconds) -->
      ${renderCounter(width - 47, timeKeyTimes, timeValues, duration)}

      <!-- Facemoji (Center) -->
      <g>
        ${faceBase}
        <g id="face-playing">
            ${eyes}
            ${smile}
            <animate attributeName="opacity" to="0" begin="${duration - 200}ms" fill="freeze"/>
        </g>
        <g id="face-won" opacity="0">
            ${sunglasses}
            ${coolSmile}
            <animate attributeName="opacity" to="1" begin="${duration - 200}ms" fill="freeze"/>
        </g>
      </g>
    `;
  }

  /**
   * Calculate animation timeline
   */
  private calculateTimeline(moves: Move[]): AnimationEvent[] {
    const events: AnimationEvent[] = [];
    let currentTime = 400;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const prevMove = i > 0 ? moves[i - 1] : null;

      // Think time: 60-120ms base
      let thinkTime = 60 + Math.random() * 60;

      // Longer for flags
      if (move.type === 'flag') {
        thinkTime += 80 + Math.random() * 80;
      }

      // Distance delay
      if (prevMove) {
        const dist = Math.sqrt(
          Math.pow(move.row - prevMove.row, 2) +
          Math.pow(move.col - prevMove.col, 2)
        );
        thinkTime += dist * 10;
      }

      // Occasional pause (3%)
      if (Math.random() < 0.03) {
        thinkTime += 150 + Math.random() * 150;
      }

      currentTime += thinkTime;

      events.push({
        move,
        startTime: currentTime,
        endTime: currentTime + 60,
      });

      currentTime += 60;
    }

    return events;
  }

  /**
   * CSS styles
   */
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

  /**
   * SVG defs
   */
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

  /**
   * Get contribution color based on count
   */
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

  /**
   * Render static board - starts uniform gray, colors appear with flags
   */
  private renderStaticBoard(board: Board): string {
    const { cellSize } = this.options;
    const isDark = this.options.darkMode;
    let html = '';

    // Start with uniform base color (empty contribution color)
    const baseColor = isDark ? '#161b22' : '#ebedf0';
    const borderColor = isDark ? '#30363d' : '#d0d7de';

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const x = col * cellSize + 0.5;
        const y = row * cellSize + 0.5;
        const size = cellSize - 1;

        // All cells start with the same base color
        html += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${baseColor}" stroke="${borderColor}" stroke-width="0.3" id="bg-${row}-${col}"/>`;
      }
    }

    return html;
  }

  /**
   * Render animated cells - only the CONTENT (numbers, flags, mines)
   * The background is already uniform, just animate what appears on top
   */
  private renderAnimatedCells(board: Board, timeline: AnimationEvent[]): string {
    const { cellSize } = this.options;
    let html = '';

    // Map events by cell
    const eventMap = new Map<string, AnimationEvent>();
    for (const event of timeline) {
      eventMap.set(`${event.move.row},${event.move.col}`, event);
    }

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const cell = board.cells[row][col];
        const event = eventMap.get(`${row},${col}`);

        if (event) {
          // Normal animated render from event
          const x = col * cellSize + 0.5;
          const y = row * cellSize + 0.5;
          const size = cellSize - 1;
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          const delay = event.startTime;

          if (event.move.type === 'flag') {
            // Flag animation
            const contributionColor = this.getContributionColor(cell.contributionCount);
            const borderColor = this.options.darkMode ? '#30363d' : '#d0d7de';

            html += `
                    <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" begin="${delay}ms" dur="80ms" fill="freeze"/>
                    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${contributionColor}" stroke="${borderColor}" stroke-width="0.3"/>
                    <use href="#flag" x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}"/>
                    </g>`;
          } else if (cell.isMine) {
            // Mine reveal
            html += `
                    <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" begin="${delay}ms" dur="60ms" fill="freeze"/>
                    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" class="cell-mine"/>
                    <use href="#mine" x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}"/>
                    </g>`;
          } else if (cell.adjacentMines > 0) {
            // Number reveal
            html += `
                    <text x="${cx}" y="${cy + 3}" text-anchor="middle" class="num n${cell.adjacentMines}" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" begin="${delay}ms" dur="60ms" fill="freeze"/>
                    ${cell.adjacentMines}
                    </text>`;
          }
        } else if (cell.isRevealed && cell.adjacentMines > 0 && !cell.isMine) {
          // SAFETY NET: Cell is revealed in final state but has no animation event.
          // This force-renders content that might have been skipped or lost.
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          // Appear at the very end (95% of duration)
          const lateDelay = timeline.length > 0 ? timeline[timeline.length - 1].endTime : 1000;

          html += `
                <text x="${cx}" y="${cy + 3}" text-anchor="middle" class="num n${cell.adjacentMines}" opacity="0">
                <animate attributeName="opacity" from="0" to="1" begin="${lateDelay}ms" dur="100ms" fill="freeze"/>
                ${cell.adjacentMines}
                </text>`;
        }
      }
    }

    return html;
  }

  /**
   * Render moving cursor
   */
  private renderCursor(timeline: AnimationEvent[], cellSize: number, padding: number, totalDuration: number): string {
    if (timeline.length === 0) return '';

    const size = cellSize + 2;
    const positions = timeline.map(e => ({
      x: padding + e.move.col * cellSize - 1,
      y: padding + e.move.row * cellSize - 1,
      time: e.startTime / totalDuration
    }));

    // Build keyframes
    const keyTimes: number[] = [0];
    const xVals: number[] = [positions[0].x];
    const yVals: number[] = [positions[0].y];

    for (const pos of positions) {
      keyTimes.push(Math.max(0.001, Math.min(0.999, pos.time - 0.005)));
      xVals.push(pos.x);
      yVals.push(pos.y);

      keyTimes.push(Math.max(0.001, Math.min(0.999, pos.time)));
      xVals.push(pos.x);
      yVals.push(pos.y);
    }

    keyTimes.push(1);
    xVals.push(positions[positions.length - 1].x);
    yVals.push(positions[positions.length - 1].y);

    const kt = keyTimes.join(';');
    const xv = xVals.join(';');
    const yv = yVals.join(';');

    return `
      <rect class="cursor" width="${size}" height="${size}" rx="2" x="${positions[0].x}" y="${positions[0].y}">
        <animate attributeName="x" values="${xv}" keyTimes="${kt}" dur="${totalDuration}ms" fill="freeze"/>
        <animate attributeName="y" values="${yv}" keyTimes="${kt}" dur="${totalDuration}ms" fill="freeze"/>
        <animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.02;0.95;1" dur="${totalDuration}ms" fill="freeze"/>
      </rect>
    `;
  }

  /**
   * Static render
   */
  renderStatic(board: Board): string {
    const fakeState: GameState = {
      board,
      isWon: false,
      isLost: false,
      revealedCells: 0,
      flaggedCells: 0,
      moves: [],
    };
    return this.render(fakeState);
  }
}

interface AnimationEvent {
  move: Move;
  startTime: number;
  endTime: number;
}
