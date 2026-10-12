import type { NextFunction, Request, RequestHandler, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { ZodType } from "zod";
import { csrfForSession } from "./csrf.js";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function asyncRoute(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res).catch(next);
  };
}

export function validateBody<S extends ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "The request body is invalid.");
  }
  return result.data;
}

export function validateUuid(value: string | string[]): string {
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_ID", "The requested identifier is invalid.");
  }
  const result = z.uuid().safeParse(value);
  if (!result.success) throw new HttpError(400, "INVALID_ID", "The requested identifier is invalid.");
  return result.data;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue."));
    return;
  }
  next();
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue."));
    return;
  }
  const provided = req.get("x-csrf-token") ?? "";
  const expected = csrfForSession(req.auth.sessionToken);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    next(new HttpError(403, "CSRF_REJECTED", "The request could not be verified."));
    return;
  }
  next();
}
