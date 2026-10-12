import type { StaffUser } from "@shelfwise/contracts";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: StaffUser;
        sessionToken: string;
      };
    }
  }
}

export {};
