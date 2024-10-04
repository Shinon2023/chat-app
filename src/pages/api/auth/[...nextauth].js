import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from 'crypto';

const prisma = new PrismaClient();

function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

export default NextAuth({
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // Credentials Provider สำหรับ Email และ Password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // ตรวจสอบผู้ใช้ในฐานข้อมูล
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // ตรวจสอบรหัสผ่าน
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Password is incorrect");
        }

        // ถ้าข้อมูลถูกต้อง ให้ส่งคืนข้อมูลผู้ใช้
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          accessRight: user.accessRight,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const password = generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      if (account.provider === "google") {
        const userFromDb = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!userFromDb) {
          await prisma.user.create({
            data: {
              email: user.email,
              username: user.name || "Unnamed",
              password: hashedPassword,
              accessRight: user.accessRight,
            },
          });
        }
      }

      if (account.provider === "credentials") {
        const accessToken = generatePassword();
        await prisma.user.update({
          where: { email: user.email },
          data: {
            accessToken,
          },
        });
        return {
          ...user,
          accessToken,
        };
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account) {
        // ถ้ามี user ให้เพิ่ม id ลงใน token
        token.id = user?.id;
        token.accessToken = account.access_token || token.accessToken;
        token.email = user?.email;
      }
      return token;
    },
    async session({ session, token }) {
      // เพิ่ม user id ลงใน session
      console.log('Token:', token);
      session.user.id = token.id;
      session.user.email = token.email;
      if (!token.accessToken) {
        token.accessToken = generatePassword();
      }
      // ตรวจสอบว่ามี accessToken หรือไม่
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
});

