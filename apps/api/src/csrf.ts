import { createHmac } from "node:crypto";
import { config } from "./config.js";

export function csrfForSession(token: string): string {
  return createHmac("sha256", config.sessionSecret)
    .update(`shelfwise-csrf:${token}`)
    .digest("hex");
}
