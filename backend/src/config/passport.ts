import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ['user:email', 'read:user', 'repo'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: passport.DoneCallback) => {
      try {
        const githubData = profile._json;

        // Create or update user
        const user = await prisma.user.upsert({
          where: { githubId: profile.id },
          update: {
            username: profile.username,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            email: profile.emails?.[0]?.value,
            bio: githubData.bio,
            location: githubData.location,
            followers: githubData.followers,
            following: githubData.following,
            publicRepos: githubData.public_repos,
            accessToken,
          },
          create: {
            githubId: profile.id,
            username: profile.username!,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            email: profile.emails?.[0]?.value,
            bio: githubData.bio,
            location: githubData.location,
            followers: githubData.followers,
            following: githubData.following,
            publicRepos: githubData.public_repos,
            accessToken,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload: any, done: passport.DoneCallback) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;

