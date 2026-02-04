# GitHub Contribution Minesweeper

Generate an animated Minesweeper game from your GitHub contributions! Watch as your contribution graph transforms into a puzzle that solves itself.

![Example](https://raw.githubusercontent.com/Jair0305/github-contribution-minesweeper/output/minesweeper-dark.svg)

## Features

- **Contribution-based mines** - Every commit day becomes a mine 💣
- **Infinite Loop Animation** - Game solves, pauses to celebrate, and restarts automatically
- **Dark & Light mode** - Automatically matches your GitHub theme
- **GitHub colors** - Uses official contribution graph colors
- **Easy setup** - detailed guide below

## Quick Start

### 1. Create a workflow file

Create a file named `.github/workflows/minesweeper.yml` in your repository with the following content:

```yaml
name: Generate Minesweeper

on:
  schedule:
    - cron: "0 0 * * *" # Runs every midnight
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: Generate Minesweeper
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3
      
      - name: Generate Minesweeper SVG
        uses: Jair0305/github-contribution-minesweeper@v1.0.3
        with:
          github_user_name: ${{ github.repository_owner }}
          # Use GITHUB_TOKEN for public commits only
          # Use a PAT (Personal Access Token) to include private repo stats
          github_token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Push to Output Branch
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          
          # Use a dedicated branch to avoid conflicts with other widgets (like Snake)
          git checkout --orphan output-minesweeper
          
          # Copy outputs
          cp -r dist/* .
          
          # Push
          git add minesweeper.svg minesweeper-dark.svg
          git commit -m "🚀 Deploy Minesweeper output" || echo "No changes to commit"
          git push origin output-minesweeper --force
```

> **Note:** To include **private contributions**, create a PAT with `repo` and `read:org` scopes, save it as a Secret (e.g., `METRICS_TOKEN`), and replace `${{ secrets.GITHUB_TOKEN }}` with `${{ secrets.METRICS_TOKEN }}`.

### 2. Add to your README

Copy this code to your profile `README.md`. We recommend `width="100%"` to match the width of other widgets like the contribution snake.

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output-minesweeper/minesweeper-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output-minesweeper/minesweeper.svg">
  <img alt="Minesweeper" src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output-minesweeper/minesweeper.svg" width="100%">
</picture>
```

### 3. Run the workflow

Go to Actions → Generate Minesweeper → Run workflow.

## Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `github_user_name` | GitHub username | **required** |
| `github_token` | GitHub token for API access | **required** |
| `output_path` | Directory for generated SVGs | `dist` |
| `mine_strategy` | Strategy (see below) | `all-contributions` |
| `mine_percentage` | % of active days as mines (for `percentage`) | `0.15` |
| `animation_speed` | Animation speed in ms | `100` |

### Mine Strategies

| Strategy | Description |
|----------|-------------|
| `all-contributions` | **Recommended.** Every day with contributions becomes a mine. |
| `top-contributors` | Only uses the top 15-20% most active days. |
| `percentage` | Uses a fixed percentage of random active days. |

## How It Works

1. **Fetches** your GitHub contribution data.
2. **Generates** a valid Minesweeper board where contributions = mines.
3. **Solves** the puzzle automatically.
4. **Animates** the solution as an SVG with an infinite loop.

The result looks like your GitHub contribution graph, but as a playable Minesweeper game!

## Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Package for release
npm run package

# Test locally
npx ts-node src/cli.ts -u YOUR_USERNAME -t YOUR_TOKEN --strategy all-contributions
```

## License

MIT © [Jair0305](https://github.com/Jair0305)
