import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { env } from "./env";

const SESSION_COOKIE = "vtech_session";
const ADMIN_COOKIE = "vtech_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function signValue(value: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(value).digest("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(`${token}:${env.SESSION_SECRET}`).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const hashed = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      token: hashed,
      userId,
      expiresAt
    }
  });

  const value = `${token}.${signValue(token)}`;
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function clearSession() {
  const cookieStore = cookies();
  const value = cookieStore.get(SESSION_COOKIE);
  if (value) {
    const [rawToken] = value.value.split(".");
    const hashed = hashToken(rawToken);
    await prisma.session.deleteMany({ where: { token: hashed } });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function getSession() {
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie) return null;
  const [rawToken, signature] = cookie.value.split(".");
  if (!rawToken || !signature || signature !== signValue(rawToken)) return null;

  const hashed = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { token: hashed },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token: hashed } });
    }
    cookies().delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export function setAdminSession() {
  const value = signValue(env.ADMIN_PASSWORD);
  cookies().set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminSession() {
  cookies().set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function isAdminAuthed(): boolean {
  const cookie = cookies().get(ADMIN_COOKIE);
  if (!cookie) return false;
  return cookie.value === signValue(env.ADMIN_PASSWORD);
}
