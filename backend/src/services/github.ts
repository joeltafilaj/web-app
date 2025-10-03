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
  async getStarredRepositories(job: GetStarredRepositoriesJob) {
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
  async getRepositoryCommits(job: GetRepositoryCommitsJob) {
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
}

export default new GitHubService();
