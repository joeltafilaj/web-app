import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import { appEvents, AppEvent } from '../services/eventEmitter';

dotenv.config();

const prisma = new PrismaClient();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Background worker to fetch commits
const worker = new Worker(
  'commits-fetch',
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
      const params: any = { per_page: 100 };
      if (latestCommit) {
        params.since = latestCommit.date.toISOString();
      }

      const response = await axios.get(
        `https://api.github.com/repos/${repoFullName}/commits`,
        {
          headers: {
            Authorization: `token ${user.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          params,
        }
      );

      const commits = response.data;

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

      // Fetch the complete repository with commits
      const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        include: {
          commits: {
            orderBy: { date: 'asc' },
          },
        },
      });
      
      // Emit event for SSE with full repository data
      appEvents.emit(AppEvent.COMMIT_JOB_COMPLETED, {
        repositoryId,
        userId,
        repoFullName,
        count: commits.length,
        repository, // Include full repo with commits
      });
      
      return { success: true, count: commits.length };
    } catch (error: any) {
      // Handle empty repository (409 error)
      if (error.response?.status === 409) {
        console.log(`Repository ${repoFullName} is empty`);
        
        // Fetch the repository (with empty commits array)
        const repository = await prisma.repository.findUnique({
          where: { id: repositoryId },
          include: {
            commits: {
              orderBy: { date: 'asc' },
            },
          },
        });
        
        appEvents.emit(AppEvent.COMMIT_JOB_COMPLETED, {
          repositoryId,
          userId,
          repoFullName,
          count: 0,
          repository,
        });
        return { success: true, count: 0 };
      }
      
      // Emit failure event
      appEvents.emit(AppEvent.COMMIT_JOB_FAILED, {
        repositoryId,
        userId,
        repoFullName,
        error: error.message,
      });
      
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

export default worker;

