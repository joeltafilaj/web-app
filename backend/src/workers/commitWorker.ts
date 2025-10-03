import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { redisConnection, QUEUE_NAME } from '../config/redis';
import { GitHubService } from '../services/github';

dotenv.config();

const prisma = new PrismaClient();

// Background worker to fetch commits
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { repositoryId, userId, repoFullName } = job.data;

    try {
      // Get user to fetch access token
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get the most recent commit date from database
      const latestCommit = await prisma.commit.findFirst({
        where: { repositoryId },
        orderBy: { date: 'desc' },
      });

      // Fetch commits from GitHub
      const since = latestCommit ? latestCommit.date.toISOString() : undefined;
      const commits = await GitHubService.getRepositoryCommits({
        accessToken: user.accessToken,
        repoFullName,
        since,
      });

      // Store commits in database
      for (const commit of commits) {
        await prisma.commit.upsert({
          where: {
            repositoryId_sha: {
              repositoryId,
              sha: commit.sha,
            },
          },
          update: {},
          create: {
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: new Date(commit.commit.author.date),
            repositoryId,
          },
        });
      }

      return { success: true, count: commits.length };
    } catch (error: any) {
      if (error.response?.status === 409) {
        return { success: true, count: 0 };
      }
      throw error;
    }
  },
  { connection: redisConnection }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

export default worker;

