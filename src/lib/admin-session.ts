import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SEC = 7 * 24 * 60 * 60;
const LOCK_AFTER_FAILURES = 5;
const LOCK_MS = 15_000;

type AdminConfig = {
  username: string;
  password: string;
  secret: string;
};

let failures = 0;
let lockedUntil = 0;

export function getAdminConfig(): AdminConfig | null {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.SESSION_SECRET ?? "";
  if (!username || !password || !secret) return null;
  return { username, password, secret };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function credentialsMatch(username: string, password: string, config: AdminConfig): boolean {
  const userOk = safeEqual(username, config.username);
  const passOk = safeEqual(password, config.password);
  return userOk && passOk;
}

export function loginRetryAfterSeconds(): number {
  const remaining = lockedUntil - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 1000);
}

export function noteLoginFailure(): void {
  failures += 1;
  if (failures >= LOCK_AFTER_FAILURES) {
    failures = 0;
    lockedUntil = Date.now() + LOCK_MS;
  }
}

export function noteLoginSuccess(): void {
  failures = 0;
  lockedUntil = 0;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken(secret: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const body = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifySessionToken(token: string, secret: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body, secret);
  const actualBuf = Buffer.from(mac);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function hasValidAdminSession(cookieHeader: string | undefined): boolean {
  const config = getAdminConfig();
  if (!config) return false;
  const token = readCookie(cookieHeader, COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, config.secret);
}

function cookieFlags(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/${secure}`;
}

export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; ${cookieFlags()}; Max-Age=${MAX_AGE_SEC}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; ${cookieFlags()}; Max-Age=0`;
}
