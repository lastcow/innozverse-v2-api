import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma, OAuthProvider } from '@repo/database';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
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
    Google,
    GitHub,
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (account?.provider && account.providerAccountId && user.email) {
        const oauthProvider = account.provider.toUpperCase() as keyof typeof OAuthProvider;

        if (oauthProvider !== 'GOOGLE' && oauthProvider !== 'GITHUB') {
          return false;
        }

        try {
          let dbUser = await prisma.user.findUnique({
            where: {
              oauthProvider_oauthId: {
                oauthProvider: OAuthProvider[oauthProvider],
                oauthId: account.providerAccountId,
              },
            },
          });

          if (!dbUser) {
            const existingUserByEmail = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (existingUserByEmail) {
              if (existingUserByEmail.oauthProvider && existingUserByEmail.oauthProvider !== OAuthProvider[oauthProvider]) {
                return false;
              }

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
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }

      if (!token.accessToken && token.sub && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, oauthProvider: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.oauthProvider = dbUser.oauthProvider ?? undefined;
          }
        } catch {
          // Prisma is unavailable in Edge Runtime (middleware).
          // The role will be resolved on the server-side auth() call instead.
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
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});

export async function getSession() {
  return await auth();
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
