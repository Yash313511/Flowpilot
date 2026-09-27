import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Organization from '@/models/Organization';

// We need to pass the native MongoClient to the adapter
async function getMongoClient() {
  await connectDB();
  // Access the underlying native connection
  return mongoose.connection.getClient();
}

const nextAuth = NextAuth({
  adapter: MongoDBAdapter(getMongoClient() as unknown as Parameters<typeof MongoDBAdapter>[0]),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select('+passwordHash');
        if (!user || !user.passwordHash) return null;

        // Simple comparison - in production use bcrypt
        const { default: bcrypt } = await import('bcryptjs');
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        await connectDB();
        const dbUser = await User.findById(user.id);
        if (dbUser?.organizationId) {
          token.organizationId = dbUser.organizationId.toString();
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          if (!user.email) return false;
          await connectDB();
          const email = user.email;
          let dbUser = await User.findOne({ email });

          if (!dbUser) {
            // Create new user
            dbUser = await User.create({
              name: user.name || 'User',
              email,
              image: user.image || undefined,
              role: 'OWNER',
            });
          }

          // If user has no organization, they'll be prompted to create one
          if (!dbUser.organizationId) {
            // Auto-create a default organization for new Google users
            const slug = `org-${dbUser._id.toString().slice(-6)}`;
            await Organization.create({
              name: `${(user.name || 'My').split(' ')[0]}'s Organization`,
              type: 'BUSINESS',
              ownerId: dbUser._id,
              slug,
            });
            const createdOrg = await Organization.findOne({ slug });
            if (createdOrg) {
              await User.findByIdAndUpdate(dbUser._id, { organizationId: createdOrg._id });
            }
          }
        } catch (error) {
          console.error('Sign-in error:', error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',
  },
  secret: process.env.AUTH_SECRET,
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export async function auth() {
  try {
    const session = await nextAuth.auth();
    if (session?.user?.organizationId) {
      return session;
    }
  } catch {
    // Continue to default session fallback
  }

  // Provide seamless default organization session so login is never required
  try {
    await connectDB();
    let defaultOrg = await Organization.findOne({ slug: 'apex-digital' });
    if (!defaultOrg) {
      defaultOrg = await Organization.findOne({});
    }
    if (!defaultOrg) {
      defaultOrg = await Organization.create({
        name: 'Apex Digital Solutions',
        slug: 'apex-digital',
        type: 'BUSINESS',
      });
    }

    let defaultUser = await User.findOne({ organizationId: defaultOrg._id });
    if (!defaultUser) {
      defaultUser = await User.findOne({});
    }
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'Alex Rivera',
        email: 'demo@flowpilot.com',
        role: 'OWNER',
        organizationId: defaultOrg._id,
      });
    }

    return {
      user: {
        id: defaultUser._id.toString(),
        name: defaultUser.name,
        email: defaultUser.email,
        organizationId: defaultOrg._id.toString(),
        role: defaultUser.role || 'OWNER',
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Default session error:', error);
    return null;
  }
}
