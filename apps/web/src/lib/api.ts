import type {
  ApiError,
  Book,
  CreateBookInput,
  CreateLoanInput,
  CreateMemberInput,
  LibraryStats,
  Loan,
  Member,
  StaffUser,
} from "@shelfwise/contracts";

let csrfToken: string | null = null;

export interface SessionResponse {
  user: StaffUser;
  csrfToken: string;
}

export function setCsrfToken(value: string | null): void {
  csrfToken = value;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (csrfToken && init.method && !["GET", "HEAD"].includes(init.method.toUpperCase())) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401 && path !== "/auth/login" && typeof window !== "undefined") {
    window.dispatchEvent(new Event("shelfwise:unauthenticated"));
  }
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    let code = "REQUEST_FAILED";
    try {
      const body = await response.json() as ApiError;
      message = body.error?.message ?? message;
      code = body.error?.code ?? code;
    } catch {
      // Keep the status-based error when the upstream response is not JSON.
    }
    throw Object.assign(new Error(message), { code, status: response.status });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<SessionResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  session: () => request<SessionResponse>("/auth/session"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  books: () => request<Book[]>("/books"),
  addBook: (input: CreateBookInput) =>
    request<Book>("/books", { method: "POST", body: JSON.stringify(input) }),
  deleteBook: (id: string) =>
    request<void>(`/books/${encodeURIComponent(id)}`, { method: "DELETE" }),
  members: () => request<Member[]>("/members"),
  addMember: (input: CreateMemberInput) =>
    request<Member>("/members", { method: "POST", body: JSON.stringify(input) }),
  loans: () => request<Loan[]>("/loans"),
  checkout: (input: CreateLoanInput) =>
    request<Loan>("/loans", { method: "POST", body: JSON.stringify(input) }),
  returnLoan: (id: string) =>
    request<void>(`/loans/${encodeURIComponent(id)}/return`, { method: "PATCH" }),
  stats: () => request<LibraryStats>("/stats"),
};
