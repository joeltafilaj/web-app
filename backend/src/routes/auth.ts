import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  githubId: string;
}

const router = Router();

// Start GitHub OAuth
router.get('/github', passport.authenticate('github'));

// GitHub OAuth callback
router.get(
  '/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { session: false }, (err: Error, user: User, info: unknown) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Handle authentication errors
      if (err) {
        return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Authentication failed with error: ' + err.message)}`);
      }

      if (!user) {
        return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Authentication failed: ' + ((info as Error)?.message ?? 'User not found.') + '.')}`);
      }

      try {
        // Generate JWT token
        const token = jwt.sign(
          { sub: user.id, githubId: user.githubId },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        );

        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('Token generation error:', error);
        res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to generate authentication token.')}`);
      }
    })(req, res, next);
  }
);

// Check authentication status
router.get(
  '/status',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const user = req.user as any;
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

export default router;

