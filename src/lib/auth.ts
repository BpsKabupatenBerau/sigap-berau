import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { ActiveSession, UserRole, getRoleLabel } from "./roles";

export type { ActiveSession, UserRole };
export { getRoleLabel };

export interface SessionPayload {
  userId: string;
  impersonatedUserId?: string | null;
  exp: number;
}

const SESSION_COOKIE_NAME = "sigap_berau_session";
const SECRET_KEY =
  process.env.AUTH_SECRET || "sigap-berau-bps-kab-berau-secret-key-2026-production";

export function hashPassword(password: string): string {
  const salt = "sigap-berau-salt-2026";
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(hash, "hex")
  );
}

export function signToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(data)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(
  userId: string,
  impersonatedUserId?: string | null
) {
  const cookieStore = await cookies();
  const token = signToken({
    userId,
    impersonatedUserId: impersonatedUserId || null,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const payload = verifyToken(rawToken);
  if (!payload) return null;

  const realDbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { opd: true },
  });

  if (!realDbUser || !realDbUser.isActive) return null;

  let effectiveDbUser = realDbUser;
  let isImpersonating = false;

  if (
    realDbUser.role === "SUPERADMIN" &&
    payload.impersonatedUserId &&
    payload.impersonatedUserId !== realDbUser.id
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { id: payload.impersonatedUserId },
      include: { opd: true },
    });
    if (targetUser && targetUser.isActive) {
      effectiveDbUser = targetUser;
      isImpersonating = true;
    }
  }

  return {
    realUser: {
      id: realDbUser.id,
      name: realDbUser.name,
      email: realDbUser.email,
      role: realDbUser.role as UserRole,
      jabatan: realDbUser.jabatan,
      opdId: realDbUser.opdId,
      opdName: realDbUser.opd?.name ?? null,
      opdShortName: realDbUser.opd?.shortName ?? null,
    },
    effectiveUser: {
      id: effectiveDbUser.id,
      name: effectiveDbUser.name,
      email: effectiveDbUser.email,
      role: effectiveDbUser.role as UserRole,
      jabatan: effectiveDbUser.jabatan,
      opdId: effectiveDbUser.opdId,
      opdName: effectiveDbUser.opd?.name ?? null,
      opdShortName: effectiveDbUser.opd?.shortName ?? null,
      activity1Name: effectiveDbUser.opd?.activity1Name ?? null,
      activity2Name: effectiveDbUser.opd?.activity2Name ?? null,
    },
    isImpersonating,
  };
}
