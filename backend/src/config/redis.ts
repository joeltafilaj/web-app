import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

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

