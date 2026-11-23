/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import dotenv from "dotenv";
import { registerAdminRoutes } from "./src/admin/routes";
import { AssistantConfigError, parseAssistantRequest, runAssistant } from "./src/lib/assistant";
import { allowAssistantRequest } from "./src/lib/assistant-rate";
import { isSafeSchoolIdentifier, normalizeUiLanguage } from "./src/lib/schools";
import { recordVisit } from "./src/lib/visits";
import { prepareDatabase } from "./src/db/bootstrap";
import { listPublicDirectory } from "./src/db/lookup-queries";
import { getSchoolDescription, listSchools, listSitemapSchools } from "./src/db/queries";
import { buildSitemap, canonicalize, injectSeo, matchPath, resolveSeo, robotsTxt } from "./src/seo/document";

dotenv.config();

const SITEMAP_TTL_MS = 5 * 60 * 1000;

function isAssetPath(pathname: string): boolean {
  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/src/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/assets/")
  ) {
    return true;
  }
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  return last.includes(".");
}

function requestOrigin(req: Request): string {
  return `${req.protocol}://${req.get("host") || "localhost"}`;
}

function publicOrigin(req: Request): string {
  const configured = (process.env.PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(configured)) return configured;
  return requestOrigin(req);
}

function originsDiffer(left: string, right: string): boolean {
  return left.replace(/\/+$/, "").toLowerCase() !== right.replace(/\/+$/, "").toLowerCase();
}

function requestSearch(req: Request): string {
  const query = req.originalUrl.indexOf("?");
  return query === -1 ? "" : req.originalUrl.slice(query);
}

function schoolCoverExists(slug: string): boolean {
  if (!isSafeSchoolIdentifier(slug)) return false;
  const file = `${slug}.jpg`;
  return [
    path.join(process.cwd(), "public", "schools", file),
    path.join(process.cwd(), "dist", "schools", file),
  ].some((candidate) => fs.existsSync(candidate));
}

async function startServer() {
  await prepareDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Public traffic reaches this process through nginx on the same VPS.
  // That connection comes from loopback or the Docker bridge, so the visitor
  // address is the one nginx appends to X-Forwarded-For, not the socket peer.
  app.set("trust proxy", "loopback, linklocal, uniquelocal");

  app.use(express.json({ limit: "256kb" }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      err instanceof SyntaxError &&
      "type" in err &&
      (err as { type?: string }).type === "entity.parse.failed"
    ) {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    next(err);
  });

  app.get("/health", (_req, res) => {
    res.send("OK");
  });

  app.get("/api/schools/:identifier/description", async (req, res) => {
    const { identifier } = req.params;

    if (!isSafeSchoolIdentifier(identifier)) {
      return res.status(400).json({ error: "Invalid identifier" });
    }

    try {
      const locale = normalizeUiLanguage(String(req.query.locale || "en"));
      const description = await getSchoolDescription(identifier, locale);
      if (description === null) {
        return res.status(404).json({ error: "Description not found" });
      }
      res.json({ description });
    } catch (error) {
      console.error("Error reading description:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/directory", async (_req, res) => {
    try {
      res.json(await listPublicDirectory());
    } catch (error) {
      console.error("Error reading directory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/schools", async (_req, res) => {
    try {
      res.json(await listSchools());
    } catch (error) {
      console.error("Error reading schools:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      yandexMapsApiKey: process.env.YANDEX_MAPS_API_KEY || "",
    });
  });

  app.post("/api/visits", async (req, res) => {
    try {
      await recordVisit(req.ip);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error incrementing visits:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/assistant", async (req, res) => {
    const parsed = parseAssistantRequest(req.body);
    if (!parsed) {
      res.status(400).json({ error: "invalid_request" });
      return;
    }

    const ip = req.ip || "unknown";
    if (!allowAssistantRequest(ip)) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }

    try {
      const schools = await listSchools();
      res.json(await runAssistant({ ...parsed, schools }));
    } catch (error) {
      if (error instanceof AssistantConfigError) {
        res.status(503).json({ error: "assistant_unavailable" });
        return;
      }
      console.error("Assistant request failed");
      res.status(502).json({ error: "assistant_failed" });
    }
  });

  registerAdminRoutes(app);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!req.originalUrl.startsWith("/api/") || res.headersSent) {
      next(err);
      return;
    }
    console.error("Unhandled API error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  let sitemapCache: { origin: string; at: number; xml: string } | null = null;
  let prodTemplate: string | null = null;

  app.get("/robots.txt", (req, res) => {
    res
      .type("text/plain; charset=utf-8")
      .set("Cache-Control", "public, max-age=3600")
      .send(robotsTxt(publicOrigin(req)));
  });

  app.get("/sitemap.xml", async (req, res, next) => {
    try {
      const origin = publicOrigin(req);
      const now = Date.now();
      if (!sitemapCache || sitemapCache.origin !== origin || now - sitemapCache.at > SITEMAP_TTL_MS) {
        sitemapCache = { origin, at: now, xml: buildSitemap(origin, await listSitemapSchools()) };
      }
      res.type("application/xml; charset=utf-8").set("Cache-Control", "public, max-age=300").send(sitemapCache.xml);
    } catch (error) {
      next(error);
    }
  });

  const vite: ViteDevServer | null =
    process.env.NODE_ENV === "production"
      ? null
      : await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });

  const htmlTemplate = async (url: string): Promise<string> => {
    if (vite) {
      const raw = await fs.promises.readFile(path.resolve("index.html"), "utf8");
      return vite.transformIndexHtml(url, raw);
    }
    if (!prodTemplate) {
      prodTemplate = await fs.promises.readFile(path.join(process.cwd(), "dist", "index.html"), "utf8");
    }
    return prodTemplate;
  };

  app.use(async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path === "/health" || req.path === "/api" || req.path.startsWith("/api/")) {
      next();
      return;
    }
    if (isAssetPath(req.path)) {
      next();
      return;
    }

    try {
      const search = requestSearch(req);
      const origin = publicOrigin(req);
      const jump = canonicalize(req.path, req.get("accept-language"));
      const pathname = jump?.pathname ?? req.path;
      if (jump || originsDiffer(origin, requestOrigin(req))) {
        res.redirect(jump?.status ?? 301, `${origin}${pathname}${search}`);
        return;
      }

      const match = matchPath(req.path);
      const schools = match.kind === "catalog" || match.kind === "school" ? await listSchools() : [];
      const school = match.kind === "school" ? schools.find((item) => item.slug === match.slug) : undefined;
      const description =
        school && match.kind === "school" ? await getSchoolDescription(school.slug, match.lang) : null;
      const doc = resolveSeo({
        origin,
        pathname: req.path,
        search,
        schools,
        catalogKnown: true,
        description,
        hasCover: school ? schoolCoverExists(school.slug) : false,
      });
      const html = injectSeo(await htmlTemplate(req.originalUrl), doc);
      res.status(doc.status).set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "no-cache").send(html);
    } catch (error) {
      if (vite) vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  if (vite) {
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist"), { index: false }));
    app.use((_req, res) => {
      res.status(404).type("text/plain; charset=utf-8").send("Not found");
    });
  }

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    console.error("Failed to render page:", err);
    res.status(500).type("text/plain; charset=utf-8").send("Internal server error");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical error during startup:", err);
  process.exit(1);
});
