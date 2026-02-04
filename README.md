# GitHub Contribution Minesweeper

Generate an animated Minesweeper game from your GitHub contributions! Watch as your contribution graph transforms into a puzzle that solves itself.

![Example](https://raw.githubusercontent.com/Jair0305/github-contribution-minesweeper/output/minesweeper-dark.svg)

## Features

- **Contribution-based mines** - Your most active days become mines
- **Animated solving** - Watch the puzzle solve step by step
- **Dark & Light mode** - Automatically matches your GitHub theme
- **GitHub colors** - Uses official contribution graph colors
- **Easy setup** - Just add a workflow file

## Quick Start

### 1. Create a workflow file

Create a file named `.github/workflows/minesweeper.yml` in your repository with the following content:

```yaml
name: Generate Minesweeper

on:
  # Run automatically every 24 hours
  schedule:
    - cron: "0 0 * * *" 
  
  # Allow manual run
  workflow_dispatch:
  
  # Run on push to main branch
  push:
    branches:
    - main

jobs:
  build:
    runs-on: ubuntu-latest
    name: Generate Minesweeper
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3
      
      - name: Generate Minesweeper SVG
        uses: Jair0305/github-contribution-minesweeper@main
        with:
          github_user_name: ${{ github.repository_owner }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Push to Output Branch
        uses: crazy-max/ghaction-github-pages@v3.1.0
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Add to your README

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/minesweeper-dark.svg"/>
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/minesweeper.svg"/>
  <img alt="GitHub Contribution Minesweeper" src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/minesweeper.svg"/>
</picture>
```

### 3. Run the workflow

Go to Actions → Generate Minesweeper → Run workflow

## Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `github_user_name` | GitHub username | **required** |
| `github_token` | GitHub token for API access | **required** |
| `output_path` | Directory for generated SVGs | `dist` |
| `mine_strategy` | How to place mines (see below) | `all-contributions` |
| `mine_percentage` | % of active days as mines | `0.15` |
| `animation_speed` | Animation speed in ms | `100` |

### Mine Strategies

| Strategy | Description |
|----------|-------------|
| `all-contributions` | Every day with commits becomes a mine 💣 |
| `top-contributors` | Only the top 15-20% most active days |
| `percentage` | Custom percentage of active days |

## How It Works

1. **Fetches** your GitHub contribution data
2. **Generates** a Minesweeper board where contributions = mines
3. **Solves** the puzzle automatically
4. **Animates** the solution as an SVG
5. **Colors** each flagged cell based on contribution level

The result looks like your GitHub contribution graph, but as a Minesweeper game!

##  Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test with your profile
npx ts-node src/cli.ts -u YOUR_USERNAME -t YOUR_TOKEN --strategy all-contributions

# Run tests
npm test
```

## License

MIT © [Jair0305](https://github.com/Jair0305)

---

⭐ If you like this project, give it a star!
