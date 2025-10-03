import { Router } from 'express';
import passport from 'passport';
import { PrismaClient, User } from '@prisma/client';
import { QUEUE } from '../workers/commits';
import { GitHubService } from '../services/github';

const router = Router();
const prisma = new PrismaClient();

// Get starred repositories
router.get(
  '/starred',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as User;

      // Fetch starred repos from GitHub
      const starredRepos = await GitHubService.getStarredRepositories({
        accessToken: user.accessToken,
      });

      // Save to database and queue jobs
      for (const repo of starredRepos) {
        const repository = await prisma.repository.upsert({
          where: {
            userId_githubId: {
              userId: user.id,
              githubId: String(repo.id),
            },
          },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            starred: true,
          },
          create: {
            githubId: String(repo.id),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            userId: user.id,
            starred: true,
          },
        });

        // Queue background job to fetch commits
        await QUEUE.add(
          'fetch-commits',
          {
            repositoryId: repository.id,
            userId: user.id,
            repoFullName: repo.full_name,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            jobId: `${user.id}-${repository.id}`,
            removeOnComplete: true,
            removeOnFail: 10,
          }
        );
      }

      // Fetch repositories with commits from database
      const repositories = await prisma.repository.findMany({
        where: { userId: user.id, starred: true },
        include: {
          commits: {
            orderBy: { date: 'desc' },
          },
        },
      });

      res.json(repositories);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch starred repositories: ${(error as Error)?.message}` });
    }
  }
);

export default router;