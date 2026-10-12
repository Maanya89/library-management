"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Book, LibraryStats, Loan, Member, StaffUser } from "@shelfwise/contracts";
import { api, setCsrfToken } from "@/lib/api";

interface LibraryContextValue {
  user: StaffUser | null;
  books: Book[];
  members: Member[];
  loans: Loan[];
  stats: LibraryStats | null;
  loading: boolean;
  error: string;
  setError: (message: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [nextBooks, nextMembers, nextLoans, nextStats] = await Promise.all([
      api.books(),
      api.members(),
      api.loans(),
      api.stats(),
    ]);
    setBooks(nextBooks);
    setMembers(nextMembers);
    setLoans(nextLoans);
    setStats(nextStats);
  }, []);

  useEffect(() => {
    const onUnauthenticated = () => {
      setCsrfToken(null);
      setUser(null);
      router.replace("/login");
    };
    window.addEventListener("shelfwise:unauthenticated", onUnauthenticated);
    let cancelled = false;
    void api.session().then(async (session) => {
      if (cancelled) return;
      setCsrfToken(session.csrfToken);
      setUser(session.user);
      await refresh();
    }).catch((reason: unknown) => {
      if (cancelled) return;
      const failure = reason as { status?: number; message?: string };
      if (failure.status === 401) {
        router.replace("/login");
      } else {
        setError(failure.message ?? "Unable to connect to the library service.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("shelfwise:unauthenticated", onUnauthenticated);
    };
  }, [refresh, router]);

  const logout = useCallback(async () => {
    await api.logout();
    setCsrfToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<LibraryContextValue>(() => ({
    user, books, members, loans, stats, loading, error, setError, refresh, logout,
  }), [user, books, members, loans, stats, loading, error, refresh, logout]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used inside LibraryProvider.");
  return context;
}
