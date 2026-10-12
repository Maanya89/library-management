"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLibrary } from "./library-provider";

const navigation = [
  { href: "/overview", label: "Overview", icon: "⌂" },
  { href: "/books", label: "Books", icon: "▤" },
  { href: "/members", label: "Members", icon: "♙" },
  { href: "/circulation", label: "Circulation", icon: "↔" },
  { href: "/reports", label: "Reports", icon: "▥" },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, error, setError, logout } = useLibrary();
  const [busy, setBusy] = useState(false);
  const page = navigation.find((item) => item.href === pathname) ?? navigation[0]!;

  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
      setBusy(false);
    }
  }

  if (loading) return <main className="loading-state">Opening your library desk…</main>;
  if (!user) {
    if (error) return <main className="loading-state form-error">{error}</main>;
    return <main className="loading-state">Redirecting to sign in…</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/overview">
          <span className="brand-mark">S</span>
          <span>Shelfwise<small>LIBRARY DESK</small></span>
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link className={`nav-link${item.href === pathname ? " active" : ""}`} href={item.href} key={item.href}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <button className="nav-link logout-link" type="button" disabled={busy} onClick={signOut}>
          <span className="nav-icon" aria-hidden="true">↪</span>{busy ? "Signing out…" : "Sign out"}
        </button>
        <div className="sidebar-bottom">
          <span className="status-dot" /><span>Library desk secure</span>
          <small>Private staff workspace</small>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {page.label}</div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date())}</span>
            <span className="avatar" aria-hidden="true">{user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span className="user-label">{user.name}<small>{user.role.toUpperCase()}</small></span>
          </div>
        </header>
        <div className="page-content">
          {error && <div className="toast form-error" role="alert">{error}<button className="toast-close" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
          {children}
          <footer className="page-footer">Shelfwise Library Desk <span>·</span> Staff data is stored securely on the library server</footer>
        </div>
      </main>
    </div>
  );
}
