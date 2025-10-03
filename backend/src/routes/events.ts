import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { appEvents, AppEvent } from '../services/eventEmitter';

const router = Router();
const prisma = new PrismaClient();

// SSE endpoint for real-time updates
// Note: EventSource cannot send headers, so we use query param for auth
router.get(
  '/stream',
  async (req: Request, res: Response) => {
    // Get token from query parameter
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.sub;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

    // Subscribe to Redis pub/sub for worker events
    const subscriber = appEvents.subscribe((channel, message) => {
      try {
        const data = JSON.parse(message);
        
        // Only send events for this user's jobs
        if (data.userId !== user.id) {
          return;
        }
        
        if (channel === AppEvent.COMMIT_JOB_COMPLETED) {
          res.write(`data: ${JSON.stringify({
            type: 'commit-completed',
            repositoryId: data.repositoryId,
            repoFullName: data.repoFullName,
            count: data.count,
            repository: data.repository
          })}\n\n`);
        } else if (channel === AppEvent.COMMIT_JOB_FAILED) {
          res.write(`data: ${JSON.stringify({
            type: 'commit-failed',
            repositoryId: data.repositoryId,
            repoFullName: data.repoFullName,
            error: data.error
          })}\n\n`);
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
      }
    });

    // Send keepalive every 30 seconds
    const keepAliveInterval = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      subscriber.quit();
      res.end();
    });
  }
);

export default router;

