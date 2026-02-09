import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { getServerSession } from 'next-auth';
import { prisma, OAuthProvider } from '@repo/database';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            accessToken: data.accessToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Skip for credentials provider (handled separately)
      if (account?.provider === 'credentials') {
        return true;
      }

      // Handle OAuth providers (Google, GitHub)
      if (account?.provider && account.providerAccountId && user.email) {
        const oauthProvider = account.provider.toUpperCase() as keyof typeof OAuthProvider;

        // Validate that this is a supported OAuth provider
        if (oauthProvider !== 'GOOGLE' && oauthProvider !== 'GITHUB') {
          return false;
        }

        try {
          // Find existing user by OAuth provider and ID
          let dbUser = await prisma.user.findUnique({
            where: {
              oauthProvider_oauthId: {
                oauthProvider: OAuthProvider[oauthProvider],
                oauthId: account.providerAccountId,
              },
            },
          });

          if (!dbUser) {
            // Check if user exists with same email (might be a credentials user)
            const existingUserByEmail = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (existingUserByEmail) {
              // If existing user has a different OAuth provider, don't allow sign in
              // This prevents account takeover via OAuth
              if (existingUserByEmail.oauthProvider && existingUserByEmail.oauthProvider !== OAuthProvider[oauthProvider]) {
                return false;
              }

              // Update existing user with OAuth info if they don't have one
              if (!existingUserByEmail.oauthProvider) {
                dbUser = await prisma.user.update({
                  where: { email: user.email },
                  data: {
                    oauthProvider: OAuthProvider[oauthProvider],
                    oauthId: account.providerAccountId,
                    emailVerified: true,
                  },
                });
              } else {
                dbUser = existingUserByEmail;
              }
            } else {
              // Create new user
              dbUser = await prisma.user.create({
                data: {
                  email: user.email,
                  oauthProvider: OAuthProvider[oauthProvider],
                  oauthId: account.providerAccountId,
                  emailVerified: true,
                },
              });
            }
          }

          // Update user object with database ID and role for JWT callback
          user.id = dbUser.id;
          user.role = dbUser.role;

          return true;
        } catch (error) {
          return false;
        }
      }

      return false;
    },
    async jwt({ token, user }) {
      // Initial sign-in: store user data in token
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }

      // For OAuth users (no accessToken), fetch fresh data from database
      // This ensures role changes are reflected in the session
      if (!token.accessToken && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, oauthProvider: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.oauthProvider = dbUser.oauthProvider ?? undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
        if (token.oauthProvider) {
          session.user.oauthProvider = token.oauthProvider as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden - Admin access required');
  }
  return session;
}
