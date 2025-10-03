import axios from 'axios';

interface GetStarredRepositoriesJob {
  accessToken: string;
}

interface GetRepositoryCommitsJob {
  accessToken: string;
  repoFullName: string;
  since?: string;
}

export class GitHubService {
  /**
   * Fetch user's starred repositories from GitHub
   */
  static async getStarredRepositories(job: GetStarredRepositoriesJob) {
    const { accessToken } = job;
    const response = await axios.get('https://api.github.com/user/starred', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      params: { per_page: 100 },
    });

    return response.data;
  }

  /**
   * Fetch commits for a specific repository from GitHub
   */
  static async getRepositoryCommits(job: GetRepositoryCommitsJob) {
    const { accessToken, repoFullName, since } = job;
    const params: any = { per_page: 100 };
    if (since) {
      params.since = since;
    }

    const response = await axios.get(
      `https://api.github.com/repos/${repoFullName}/commits`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params,
      }
    );

    return response.data;
  }

  /**
   * Fetch languages used in a repository
   */
  static async getRepositoryLanguages(accessToken: string, repoFullName: string) {
    const response = await axios.get(
      `https://api.github.com/repos/${repoFullName}/languages`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data;
  }

  /**
   * Revoke access token from GitHub
   */
  static async revoke(accessToken: string): Promise<void> {
    await axios.delete(
      `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
      {
        auth: {
          username: process.env.GITHUB_CLIENT_ID!,
          password: process.env.GITHUB_CLIENT_SECRET!,
        },
        data: {
          access_token: accessToken,
        },
      }
    );
  }
}