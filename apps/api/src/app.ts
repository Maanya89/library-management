import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { Redis } from "ioredis";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { createHash, createHmac } from "node:crypto";
import { pool } from "./db.js";
import { HttpError } from "./http.js";
import { authRoutes } from "./routes/auth-routes.js";
import { bookRoutes } from "./routes/book-routes.js";
import { loanRoutes } from "./routes/loan-routes.js";
import { memberRoutes } from "./routes/member-routes.js";
import { statsRoutes } from "./routes/stats-routes.js";
import { config } from "./config.js";

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

redis.on("error", (error) => {
  console.error(JSON.stringify({ event: "redis_error", message: error.message }));
});

function redisStore(prefix: string): RedisStore {
  return new RedisStore({
    prefix,
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      const reply = await redis.call(args[0]!, ...args.slice(1));
      if (typeof reply === "boolean" || typeof reply === "number" || typeof reply === "string") {
        return reply;
      }
      if (Array.isArray(reply) && reply.every((item) =>
        typeof item === "boolean" || typeof item === "number" || typeof item === "string")) {
        return reply;
      }
      throw new Error("Redis returned an unexpected rate-limit response.");
    },
  });
}

export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "no-referrer" },
  }));

  app.use("/healthz", (_req, res, next) => {
    void Promise.all([pool.query("SELECT 1"), redis.ping()]).then(() => {
      res.status(200).json({ status: "ok" });
    }).catch(next);
  });

  app.use("/api", (req, _res, next) => {
    const origin = req.get("origin");
    if (origin && !config.webOrigins.has(origin)) {
      next(new HttpError(403, "ORIGIN_REJECTED", "Request origin is not allowed."));
      return;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        (!origin || !config.webOrigins.has(origin))) {
      next(new HttpError(403, "ORIGIN_REQUIRED", "A trusted request origin is required."));
      return;
    }
    next();
  });

  app.use("/api", cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);
      if (!config.webOrigins.has(origin)) {
        return callback(new HttpError(403, "ORIGIN_REJECTED", "Request origin is not allowed."));
      }
      return callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    maxAge: 600,
    optionsSuccessStatus: 204,
  }));
  app.use("/api", express.json({ limit: "32kb", strict: true }));

  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator(req) {
      const cookie = req.headers.cookie ?? "";
      const session = cookie.match(/(?:^|;\s*)__Host-shelfwise-session=([a-f0-9]{64})(?:;|$)/)?.[1];
      return session ? `session:${createHash("sha256").update(session).digest("hex")}` : ipKeyGenerator(req.ip ?? "");
    },
    store: redisStore("shelfwise:api:"),
    message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
  }));

  app.use("/api/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator(req) {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      return email
        ? `account:${createHmac("sha256", config.sessionSecret).update(email).digest("hex")}`
        : ipKeyGenerator(req.ip ?? "");
    },
    store: redisStore("shelfwise:login:"),
  }));

  app.use("/api/auth", authRoutes);
  app.use("/api/books", bookRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/stats", statsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found." } });
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    const candidate = error as { code?: string; status?: number; type?: string; message?: string };
    if (candidate.type === "entity.parse.failed") {
      res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
      return;
    }
    if (candidate.code === "23505") {
      res.status(409).json({ error: { code: "DUPLICATE_VALUE", message: "A record with that value already exists." } });
      return;
    }
    if (candidate.code === "23503") {
      res.status(409).json({ error: { code: "RELATED_RECORD_EXISTS", message: "The record is still in use." } });
      return;
    }
    console.error(JSON.stringify({
      event: "unhandled_api_error",
      message: candidate.message ?? "Unknown error",
    }));
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } });
  };
  app.use(errorHandler);

  return app;
}
