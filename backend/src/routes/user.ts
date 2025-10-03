import { Router } from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
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

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

export default router;

