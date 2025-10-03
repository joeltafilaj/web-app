import { Redis } from 'ioredis';

// Use Redis Pub/Sub for cross-process communication
const publisher = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Event types
export enum AppEvent {
  COMMIT_JOB_COMPLETED = 'commit:job:completed',
  COMMIT_JOB_FAILED = 'commit:job:failed',
}

// Emit events via Redis pub/sub
export const appEvents = {
  emit: (event: AppEvent, data: any) => {
    publisher.publish(event, JSON.stringify(data));
  },
  
  // Subscribe to events (for SSE route)
  subscribe: (callback: (channel: string, message: string) => void) => {
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    
    subscriber.subscribe(
      AppEvent.COMMIT_JOB_COMPLETED,
      AppEvent.COMMIT_JOB_FAILED
    );
    
    subscriber.on('message', callback);
    
    return subscriber;
  },
};

