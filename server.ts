/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { registerAdminRoutes } from "./src/admin/routes";
import { AssistantConfigError, parseAssistantRequest, runAssistant } from "./src/lib/assistant";
import { allowAssistantRequest } from "./src/lib/assistant-rate";
import { isSafeSchoolIdentifier, normalizeUiLanguage } from "./src/lib/schools";
import { recordVisit } from "./src/lib/visits";
import { prepareDatabase } from "./src/db/bootstrap";
import { listPublicDirectory } from "./src/db/lookup-queries";
import { getSchoolDescription, listSchools } from "./src/db/queries";

dotenv.config();

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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical error during startup:", err);
  process.exit(1);
});
