import type { Express, NextFunction, Request, Response } from "express";
import {
  clearSessionCookie,
  createSessionToken,
  credentialsMatch,
  getAdminConfig,
  hasValidAdminSession,
  loginRetryAfterSeconds,
  noteLoginFailure,
  noteLoginSuccess,
  sessionCookie,
} from "../lib/admin-session";
import { SLUG_TAKEN_MESSAGE, validateSchoolInput } from "./validate";
import { fillMissingNameTranslations } from "../lib/translate-name";
import {
  assignSlug,
  createAdminSchool,
  isSlugConflict,
  isSlugTaken,
  listAdminSchools,
  updateAdminSchool,
} from "../db/admin-queries";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!getAdminConfig()) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  if (!hasValidAdminSession(req.headers.cookie)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

async function login(req: Request, res: Response): Promise<void> {
  const config = getAdminConfig();
  if (!config) {
    res.status(503).json({ error: "not_configured" });
    return;
  }

  const retryAfter = loginRetryAfterSeconds();
  if (retryAfter > 0) {
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "rate_limited", retryAfter });
    return;
  }

  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!credentialsMatch(username, password, config)) {
    noteLoginFailure();
    const nextRetry = loginRetryAfterSeconds();
    if (nextRetry > 0) {
      res.setHeader("Retry-After", String(nextRetry));
      res.status(429).json({ error: "rate_limited", retryAfter: nextRetry });
      return;
    }
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  noteLoginSuccess();
  res.setHeader("Set-Cookie", sessionCookie(createSessionToken(config.secret)));
  res.json({ ok: true });
}

function logout(_req: Request, res: Response): void {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.json({ ok: true });
}

function session(req: Request, res: Response): void {
  if (!getAdminConfig()) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  if (!hasValidAdminSession(req.headers.cookie)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({ ok: true });
}

async function list(_req: Request, res: Response): Promise<void> {
  res.json(await listAdminSchools());
}

async function create(req: Request, res: Response): Promise<void> {
  const parsed = validateSchoolInput(req.body);
  if (parsed.ok === false) {
    res.status(400).json({ error: "validation", fields: parsed.fields });
    return;
  }
  const translated = await fillMissingNameTranslations(parsed.value.translations);
  const input = await assignSlug({ ...parsed.value, translations: translated.translations });
  if (await isSlugTaken(input.slug)) {
    res.status(400).json({ error: "validation", fields: { slug: SLUG_TAKEN_MESSAGE } });
    return;
  }
  try {
    const result = await createAdminSchool(input);
    res.status(201).json({
      ...result.school,
      geocodeWarning: result.geocodeWarning,
      translationWarning: translated.incomplete,
    });
  } catch (error) {
    if (isSlugConflict(error)) {
      res.status(400).json({ error: "validation", fields: { slug: SLUG_TAKEN_MESSAGE } });
      return;
    }
    throw error;
  }
}

async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }
  const parsed = validateSchoolInput(req.body);
  if (parsed.ok === false) {
    res.status(400).json({ error: "validation", fields: parsed.fields });
    return;
  }
  const input = await assignSlug(parsed.value, id);
  if (await isSlugTaken(input.slug, id)) {
    res.status(400).json({ error: "validation", fields: { slug: SLUG_TAKEN_MESSAGE } });
    return;
  }
  try {
    const result = await updateAdminSchool(id, input);
    if (!result) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ...result.school, geocodeWarning: result.geocodeWarning });
  } catch (error) {
    if (isSlugConflict(error)) {
      res.status(400).json({ error: "validation", fields: { slug: SLUG_TAKEN_MESSAGE } });
      return;
    }
    throw error;
  }
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

export function registerAdminRoutes(app: Express): void {
  app.post("/api/admin/login", asyncRoute(login));
  app.post("/api/admin/logout", logout);
  app.get("/api/admin/session", session);
  app.get("/api/admin/schools", requireAdmin, asyncRoute(list));
  app.post("/api/admin/schools", requireAdmin, asyncRoute(create));
  app.put("/api/admin/schools/:id", requireAdmin, asyncRoute(update));
}
