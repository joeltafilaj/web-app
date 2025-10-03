import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import { GitHubService } from '../services/github';

const router = Router();
const prisma = new PrismaClient();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Start GitHub OAuth
router.get('/github', passport.authenticate('github'));

// GitHub OAuth callback
router.get(
  '/github/callback',
  (request, result, next) => {
    passport.authenticate('github', { session: false }, (err: Error, user: User, info: unknown) => {
      if (err) {
        return result.redirect(errorUrl(err.message));
      }
      if (!user) {
        return result.redirect(errorUrl(((info as Error)?.message ?? 'User not found.')));
      }

      try {
        const token = jwt.sign(
          { sub: user.id, githubId: user.githubId },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        );

        result.redirect(successUrl(token));
      } catch (error) {
        result.redirect(errorUrl((error as Error).message));
      }
    })(request, result, next);
  }
);

// Check authentication status
router.get(
  '/status',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const user = req.user as User;
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        email: user.email,
      },
    });
  }
);

// Logout and revoke GitHub token
router.post(
  '/logout',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as User;

      // Get user's access token from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { accessToken: true, githubId: true },
      });

      if (!dbUser?.accessToken) {
        return res.json({ success: true, message: 'Already logged out' });
      }

      // Revoke token from GitHub
      try {
        await GitHubService.revoke(dbUser.accessToken);
      } catch (error) {
        console.error('Failed to revoke GitHub token:', error);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { accessToken: '' },
      });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  }
);

function errorUrl(error: string) { 
  return `${FRONTEND_URL}/auth/callback?error=${encodeURIComponent('Authentication failed with error: ' + error)}`;
}
function successUrl(token: string) { 
  return `${FRONTEND_URL}/auth/callback?token=${token}`;
}

export default router;

