import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { GitHubService } from '../services/github';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

// Shared Redis connection configuration
export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const QUEUE_NAME = 'commits-fetch';

// Shared queue instance
export const commitsQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

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

      // Fetch and store language data
      try {
        const languages = await GitHubService.getRepositoryLanguages(user.accessToken, repoFullName);
        await prisma.repository.update({
          where: { id: repositoryId },
          data: { languages },
        });
      } catch (error) {
        console.error(`Failed to fetch languages for ${repoFullName}:`, error);
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

