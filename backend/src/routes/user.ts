import { Router } from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user profile with statistics
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get basic user info
      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          email: true,
          createdAt: true,
        },
      });

      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user statistics
      const totalRepositories = await prisma.repository.count({
        where: { userId: user.id }
      });

      const totalCommits = await prisma.commit.count({
        where: {
          repository: {
            userId: user.id
          }
        }
      });

      // Get most active repository (by commit count)
      const mostActiveRepo = await prisma.repository.findFirst({
        where: { userId: user.id },
        include: {
          commits: {
            orderBy: { date: 'desc' },
            take: 10
          }
        },
        orderBy: {
          commits: {
            _count: 'desc'
          }
        }
      });

      // Get last activity (most recent commit)
      const lastCommit = await prisma.commit.findFirst({
        where: {
          repository: {
            userId: user.id
          }
        },
        orderBy: { date: 'desc' },
        select: { date: true }
      });

      res.json({
        ...profile,
        totalRepositories,
        totalCommits,
        mostActiveRepo,
        lastActivity: lastCommit?.date || null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

export default router;

