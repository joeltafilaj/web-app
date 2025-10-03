import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { WORKER_NAME } from '../workers/commitWorker';

interface GetCommitsJob {
  repositoryId: string;
  userId: string;
  repoFullName: string;
}

export class QueueService {
  private commitsQueue: Queue;
  private connection: Redis;

  constructor() {
    // Redis connection for job queue
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

    // Create job queue
    this.commitsQueue = new Queue('commits-fetch', { 
      connection: this.connection 
    });
  }

  /**
   * Queue a commit fetch job for a repository
   */
  async getCommits(job: GetCommitsJob): Promise<void> {
    const { repositoryId, userId, repoFullName } = job;
    await this.commitsQueue.add(
      WORKER_NAME,
      {repositoryId, userId, repoFullName,},
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const waiting = await this.commitsQueue.getWaitingCount();
    const active = await this.commitsQueue.getActiveCount();
    const completed = await this.commitsQueue.getCompletedCount();
    const failed = await this.commitsQueue.getFailedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active,
    };
  }

  /**
   * Close the connection
   */
  async close() {
    await this.commitsQueue.close();
    await this.connection.quit();
  }
}

export default new QueueService();
