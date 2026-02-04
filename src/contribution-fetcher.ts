import { graphql } from '@octokit/graphql';
import {
    GitHubContributionData,
    ContributionCalendar,
    ContributionDay
} from './types';

const CONTRIBUTION_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export class ContributionFetcher {
    private graphqlClient: typeof graphql;

    constructor(token: string) {
        this.graphqlClient = graphql.defaults({
            headers: {
                authorization: `token ${token}`,
            },
        });
    }

    /**
     * Fetch contribution data for a GitHub user
     */
    async fetchContributions(username: string): Promise<ContributionCalendar> {
        try {
            const response = await this.graphqlClient<GitHubContributionData>(
                CONTRIBUTION_QUERY,
                { username }
            );

            if (!response.user) {
                throw new Error(`User "${username}" not found`);
            }

            return response.user.contributionsCollection.contributionCalendar;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch contributions: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Convert contribution calendar to a 2D grid of days
     * Returns a matrix where rows are days of week (0-6) and columns are weeks
     */
    getContributionGrid(calendar: ContributionCalendar): ContributionDay[][] {
        const grid: ContributionDay[][] = [];

        // Initialize 7 rows (one for each day of the week)
        for (let i = 0; i < 7; i++) {
            grid.push([]);
        }

        // Fill the grid with contribution days
        for (const week of calendar.weeks) {
            for (const day of week.contributionDays) {
                const dayOfWeek = new Date(day.date).getDay();
                grid[dayOfWeek].push(day);
            }
        }

        return grid;
    }

    /**
     * Get statistics about contributions
     */
    getContributionStats(calendar: ContributionCalendar): ContributionStats {
        let maxContributions = 0;
        let totalDays = 0;
        let activeDays = 0;
        const contributionCounts: number[] = [];

        for (const week of calendar.weeks) {
            for (const day of week.contributionDays) {
                totalDays++;
                contributionCounts.push(day.contributionCount);

                if (day.contributionCount > 0) {
                    activeDays++;
                }

                if (day.contributionCount > maxContributions) {
                    maxContributions = day.contributionCount;
                }
            }
        }

        // Sort to calculate percentiles
        contributionCounts.sort((a, b) => a - b);

        const p80Index = Math.floor(contributionCounts.length * 0.8);
        const p80Threshold = contributionCounts[p80Index] || 1;

        return {
            totalContributions: calendar.totalContributions,
            totalDays,
            activeDays,
            maxContributions,
            p80Threshold, // 80th percentile - will be used for mine placement
            averageContributions: calendar.totalContributions / totalDays,
        };
    }
}

export interface ContributionStats {
    totalContributions: number;
    totalDays: number;
    activeDays: number;
    maxContributions: number;
    p80Threshold: number;
    averageContributions: number;
}
