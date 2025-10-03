import { Router } from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// Redis connection for job queue
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create job queue
const commitsQueue = new Queue('commits-fetch', { connection });

// Get starred repositories
router.get(
  '/starred',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;

      // Fetch starred repos from GitHub
      const response = await axios.get('https://api.github.com/user/starred', {
        headers: {
          Authorization: `token ${user.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: { per_page: 100 },
      });

      const starredRepos = response.data;
      const repositories = [];
      let jobCount = 0;

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

        repositories.push(repository);

        // Queue background job to fetch commits
        await commitsQueue.add(
          'fetch-commits',
          {
            repositoryId: repository.id,
            userId: user.id,
            repoFullName: repo.full_name,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          }
        );
        
        jobCount++;
      }

      // Send repositories with job count
      res.json({
        repositories,
        jobCount
      });
    } catch (error: any) {
      console.error('Error fetching starred repos:', error.message);
      res.status(500).json({ error: 'Failed to fetch starred repositories' });
    }
  }
);

export default router;