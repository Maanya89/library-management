"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, setCsrfToken } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const session = await api.login(
        String(values.get("email") ?? "").trim(),
        String(values.get("password") ?? ""),
      );
      setCsrfToken(session.csrfToken);
      router.replace("/overview");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="panel login-panel">
        <a className="brand login-brand" href="/login">
          <span className="brand-mark">S</span>
          <span>Shelfwise<small>LIBRARY DESK</small></span>
        </a>
        <p className="eyebrow">STAFF ACCESS</p>
        <h1>Welcome back</h1>
        <p className="page-subtitle">Sign in to manage your library workspace.</p>
        <form className="stacked-form" onSubmit={submit}>
          <label>Email address<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary full-width" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="form-footnote">Staff accounts are provisioned by an administrator.</p>
      </section>
    </main>
  );
}
