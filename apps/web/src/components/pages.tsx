"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Book } from "@shelfwise/contracts";
import { api } from "@/lib/api";
import { useLibrary } from "./library-provider";

const dateOnly = (value: string) => new Date(value).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric",
});

function Metric({ label, value, tone = "green" }: { label: string; value: number | string; tone?: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-symbol ${tone}`} aria-hidden="true">•</span></div><strong>{value}</strong></article>;
}

function PageHeading({ eyebrow, title, subtitle, action }: {
  eyebrow: string; title: string; subtitle: string; action?: ReactNode;
}) {
  return <section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>{action}</section>;
}

export function OverviewPage() {
  const { stats, loans, books, members } = useLibrary();
  const recent = [...loans].slice(0, 5);
  const dueSoon = loans.filter((loan) => loan.status === "active")
    .filter((loan) => new Date(`${loan.dueDate}T00:00:00`) <= new Date(Date.now() + 7 * 86_400_000))
    .slice(0, 5);
  return <>
    <PageHeading eyebrow="YOUR LIBRARY AT A GLANCE" title="Overview" subtitle="A clear view of today's collection and circulation." action={<Link className="button button-primary" href="/circulation">+ New checkout</Link>} />
    <section className="metric-grid" aria-label="Library summary">
      <Metric label="Titles in catalog" value={stats?.titles ?? 0} />
      <Metric label="Checked out" value={stats?.activeLoans ?? 0} tone="blue" />
      <Metric label="Due today" value={stats?.dueToday ?? 0} tone="amber" />
      <Metric label="Overdue" value={stats?.overdue ?? 0} tone="coral" />
    </section>
    <section className="dashboard-grid">
      <article className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest checkouts</h2></div><Link className="text-link" href="/circulation">View all →</Link></div>
        {recent.length ? recent.map((loan) => <div className="activity-item" key={loan.id}><div className="activity-book"><strong>{loan.bookTitle}</strong><span>{loan.memberName}</span></div><span className={`activity-status ${loan.status === "active" ? "status-open" : "status-closed"}`}>{loan.status}</span></div>) : <p className="empty">No loans recorded yet.</p>}
      </article>
      <article className="panel popular-panel"><div className="panel-heading"><div><p className="eyebrow">COLLECTION</p><h2>Library totals</h2></div></div>
        <div className="popular-item"><strong>{stats?.copies ?? 0} copies</strong><span>in the catalog</span></div>
        <div className="popular-item"><strong>{stats?.availableCopies ?? 0} available</strong><span>ready to borrow</span></div>
        <div className="popular-item"><strong>{stats?.activeMembers ?? 0} {(stats?.activeMembers ?? 0) === 1 ? "member" : "members"}</strong><span>{members.length} member records</span></div>
        <div className="popular-item"><strong>{books.length} {books.length === 1 ? "title" : "titles"}</strong><span>across the collection</span></div>
      </article>
    </section>
    <section className="lower-grid">
      <article className="panel due-panel"><div className="panel-heading"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Coming due</h2></div><Link className="text-link" href="/circulation">Manage loans →</Link></div>
        {dueSoon.length ? dueSoon.map((loan) => <div className="due-item" key={loan.id}><div><strong>{loan.bookTitle}</strong><span>{loan.memberName}</span></div><span>{dateOnly(loan.dueDate)}</span></div>) : <p className="empty">Nothing due this week.</p>}
      </article>
      <article className="panel note-panel"><div className="note-decoration" aria-hidden="true">✳</div><p className="eyebrow">SHELFWISE</p><h2>Make room for curiosity.</h2><p>Keep your catalog and member records up to date.</p><Link className="button button-light" href="/books">Open the catalog <span>→</span></Link></article>
    </section>
  </>;
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}><section className="form-dialog form-dialog-open" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div className="dialog-heading"><div><p className="eyebrow">LIBRARY RECORD</p><h2 id="dialog-title">{title}</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close">×</button></div>
    {children}
  </section></div>;
}

export function BooksPage() {
  const { books, refresh, setError, stats } = useLibrary();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const filtered = books.filter((book) => `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(query.toLowerCase()))
    .filter((book) => filter === "all" || (filter === "available" ? book.availableCopies > 0 : book.availableCopies === 0));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api.addBook({
        title: String(data.get("title") ?? "").trim(),
        author: String(data.get("author") ?? "").trim(),
        genre: String(data.get("genre") ?? "").trim(),
        isbn: String(data.get("isbn") ?? "").trim(),
        copies: Number(data.get("copies")),
      });
      setAdding(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to add book.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(book: Book) {
    if (!window.confirm(`Delete "${book.title}"? Books with loan history cannot be deleted.`)) return;
    try {
      await api.deleteBook(book.id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete book.");
    }
  }

  return <>
    <PageHeading eyebrow="YOUR COLLECTION" title="Books" subtitle="Manage titles, copies, and availability." action={<button className="button button-primary" onClick={() => setAdding(true)}>+ Add a book</button>} />
    <section className="metric-grid compact-metrics"><Metric label="Total titles" value={stats?.titles ?? 0} /><Metric label="Available copies" value={stats?.availableCopies ?? 0} tone="blue" /><Metric label="Checked out" value={stats?.activeLoans ?? 0} tone="amber" /></section>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2>Catalog</h2><p className="table-caption">{filtered.length} titles</p></div><div className="table-controls"><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or author" aria-label="Search books" /></label><select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter books"><option value="all">All statuses</option><option value="available">Available</option><option value="checked-out">Checked out</option></select></div></div>
      <div className="table-scroll"><table><thead><tr><th>BOOK</th><th>AUTHOR</th><th>GENRE</th><th>AVAILABILITY</th><th>STATUS</th><th>MANAGE</th></tr></thead><tbody>{filtered.map((book) => <tr key={book.id}><td><strong>{book.title}</strong>{book.isbn && <small className="table-secondary">ISBN {book.isbn}</small>}</td><td>{book.author}</td><td>{book.genre}</td><td>{book.availableCopies}/{book.copies}</td><td><span className={`status-badge ${book.availableCopies > 0 ? "status-active" : "status-closed"}`}>{book.availableCopies > 0 ? "Available" : "Checked out"}</span></td><td><button className="button button-quiet" onClick={() => void remove(book)}>Delete</button></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="empty-state">{query ? "No books match your search." : "No books yet. Add a book to get started."}</div>}
    </section>
    {adding && <Dialog title="Add a book" onClose={() => setAdding(false)}><form className="stacked-form" onSubmit={submit}>
      <label>Book title<input name="title" required maxLength={255} autoFocus /></label><label>Author<input name="author" required maxLength={255} /></label>
      <div className="form-row"><label>Genre<input name="genre" required maxLength={80} /></label><label>Copies<input name="copies" type="number" min={1} max={999} defaultValue={1} required /></label></div>
      <label>ISBN <span className="optional">(optional)</span><input name="isbn" maxLength={20} /></label>
      <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={() => setAdding(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Add to catalog"}</button></div>
    </form></Dialog>}
  </>;
}

export function MembersPage() {
  const { members, refresh, setError, stats } = useLibrary();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const filtered = members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api.addMember({ name: String(data.get("name") ?? "").trim(), email: String(data.get("email") ?? "").trim() });
      setAdding(false);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to add member.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeading eyebrow="YOUR READING COMMUNITY" title="Members" subtitle="Keep member details and library activity up to date." action={<button className="button button-primary" onClick={() => setAdding(true)}>+ Add a member</button>} />
    <section className="metric-grid compact-metrics"><Metric label="Active members" value={stats?.activeMembers ?? 0} /><Metric label="Currently borrowing" value={members.filter((member) => member.booksOut > 0).length} tone="blue" /><Metric label="New this month" value={members.filter((member) => new Date(member.joinedAt).getMonth() === new Date().getMonth() && new Date(member.joinedAt).getFullYear() === new Date().getFullYear()).length} tone="amber" /></section>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2>Member directory</h2><p className="table-caption">{filtered.length} members</p></div><div className="table-controls"><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search members" /></label></div></div>
      <div className="table-scroll"><table><thead><tr><th>MEMBER</th><th>EMAIL</th><th>MEMBER SINCE</th><th>BOOKS OUT</th><th>STATUS</th></tr></thead><tbody>{filtered.map((member) => <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.email}</td><td>{dateOnly(member.joinedAt)}</td><td>{member.booksOut}</td><td><span className="status-badge status-active">{member.status}</span></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="empty-state">{query ? "No members match your search." : "No members yet. Add a member to get started."}</div>}
    </section>
    {adding && <Dialog title="Add a member" onClose={() => setAdding(false)}><form className="stacked-form" onSubmit={submit}>
      <label>Full name<input name="name" required maxLength={150} autoFocus /></label><label>Email address<input name="email" type="email" required maxLength={254} /></label>
      <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={() => setAdding(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Add member"}</button></div>
    </form></Dialog>}
  </>;
}

export function CirculationPage() {
  const { books, members, loans, refresh, setError, stats } = useLibrary();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const availableBooks = books.filter((book) => book.availableCopies > 0);
  const activeMembers = members.filter((member) => member.status === "active");
  const visible = loans.filter((loan) => {
    if (filter === "all") return true;
    if (filter === "active") return loan.status === "active";
    if (filter === "returned") return loan.status === "returned";
    if (filter === "overdue") return loan.status === "active" && loan.dueDate < new Date().toISOString().slice(0, 10);
    return loan.status === "active" && loan.dueDate <= new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  });

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      await api.checkout({
        bookId: String(data.get("bookId")),
        memberId: String(data.get("memberId")),
        dueDate: String(data.get("dueDate")),
      });
      form.reset();
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to check out the book.");
    } finally {
      setBusy(false);
    }
  }

  async function returnLoan(id: string) {
    try {
      await api.returnLoan(id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to return the book.");
    }
  }

  return <>
    <PageHeading eyebrow="LOANS & RETURNS" title="Circulation" subtitle="Check out books, record returns, and track due dates." />
    <section className="metric-grid compact-metrics"><Metric label="Active loans" value={stats?.activeLoans ?? 0} tone="blue" /><Metric label="Due today" value={stats?.dueToday ?? 0} tone="amber" /><Metric label="Overdue" value={stats?.overdue ?? 0} tone="coral" /></section>
    <section className="circulation-layout"><article className="panel checkout-panel"><div className="panel-heading"><div><p className="eyebrow">START A LOAN</p><h2>Check out a book</h2></div></div>
      <form className="stacked-form" onSubmit={checkout}><label>Member<select name="memberId" required defaultValue=""><option value="" disabled>Choose a member</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <label>Book<select name="bookId" required defaultValue=""><option value="" disabled>Choose an available book</option>{availableBooks.map((book) => <option key={book.id} value={book.id}>{book.title} ({book.availableCopies} available)</option>)}</select></label>
        <label>Due date<input name="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)} required /></label>
        <button className="button button-primary full-width" disabled={busy || !availableBooks.length || !activeMembers.length}>{busy ? "Saving…" : "Confirm checkout →"}</button>
      </form><p className="form-footnote">Standard loan period: 14 days</p>
    </article>
    <article className="panel loans-panel"><div className="table-toolbar"><div><p className="eyebrow">ON THE MOVE</p><h2>Loan history</h2></div><select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter loans"><option value="all">All loans</option><option value="active">Active</option><option value="due">Due soon</option><option value="overdue">Overdue</option><option value="returned">Returned</option></select></div>
      <div className="table-scroll"><table><thead><tr><th>BOOK & MEMBER</th><th>CHECKED OUT</th><th>DUE DATE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{visible.map((loan) => <tr key={loan.id}><td><strong>{loan.bookTitle}</strong><small className="table-secondary">{loan.memberName}</small></td><td>{dateOnly(loan.checkedOut)}</td><td>{dateOnly(loan.dueDate)}</td><td><span className={`status-badge ${loan.status === "active" ? loan.dueDate < new Date().toISOString().slice(0, 10) ? "status-overdue" : "status-active" : "status-closed"}`}>{loan.status === "returned" ? "Returned" : loan.dueDate < new Date().toISOString().slice(0, 10) ? "Overdue" : "Active"}</span></td><td>{loan.status === "active" && <button className="button button-quiet" onClick={() => void returnLoan(loan.id)}>Return</button>}</td></tr>)}</tbody></table></div>
      {!visible.length && <div className="empty-state">No loans in this view.</div>}
    </article></section>
  </>;
}

function csvCell(value: string | number): string {
  let safe = String(value);
  if (/^[\u0000-\u0020]*[=+\-@]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function ReportsPage() {
  const { books, loans, stats } = useLibrary();
  const year = new Date().getFullYear();
  const monthly = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    label: new Date(year, index, 1).toLocaleDateString("en", { month: "short" }),
    count: loans.filter((loan) => {
      const date = new Date(loan.checkedOut);
      return date.getFullYear() === year && date.getMonth() === index;
    }).length,
  })), [loans, year]);
  const maxCount = Math.max(...monthly.map((item) => item.count), 1);
  const genreTotals = books.reduce<Record<string, number>>((totals, book) => {
    totals[book.genre] = (totals[book.genre] ?? 0) + 1;
    return totals;
  }, {});
  const popular = [...books].map((book) => ({
    ...book,
    count: loans.filter((loan) => loan.bookId === book.id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  function downloadCsv() {
    const rows = [["Title", "Author", "Member", "Checked out", "Due date", "Status"],
      ...loans.map((loan) => [loan.bookTitle, loan.bookAuthor, loan.memberName, loan.checkedOut, loan.dueDate, loan.status])];
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shelfwise-circulation-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const returnRate = stats?.totalLoans ? Math.round((stats.returnedLoans / stats.totalLoans) * 100) : 0;
  const utilization = stats?.copies ? Math.round(((stats.copies - stats.availableCopies) / stats.copies) * 100) : 0;
  return <>
    <PageHeading eyebrow="THE BIGGER PICTURE" title="Reports" subtitle="A clear view of circulation and collection activity." action={<button className="button button-secondary" onClick={downloadCsv}>Download CSV ↓</button>} />
    <section className="metric-grid compact-metrics"><Metric label="Loans recorded" value={stats?.totalLoans ?? 0} tone="blue" /><Metric label="Return rate" value={`${returnRate}%`} /><Metric label="Catalog utilization" value={`${utilization}%`} tone="amber" /></section>
    <section className="reports-grid"><article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">BORROWING TRENDS</p><h2>Loans by month</h2></div></div>
      <div className="bar-chart" aria-label="Monthly loan counts">{monthly.map((item, index) => {
        const level = Math.min(10, Math.ceil((item.count / maxCount) * 10));
        return <div className="bar-column" title={`${item.count} loans in ${item.label}`} key={item.label}>
          <div className="bar-track"><span className={`bar-fill bar-level-${level}`}><span>{item.count}</span></span></div>
          <span className="bar-month">{item.label}</span>
        </div>;
      })}</div>
    </article><article className="panel genre-panel"><div className="panel-heading"><div><p className="eyebrow">COLLECTION MIX</p><h2>Books by genre</h2></div></div>{Object.entries(genreTotals).sort((a, b) => b[1] - a[1]).map(([genre, count]) => <div className="genre-item" key={genre}><span>{genre}</span><strong>{count}</strong></div>)}{!books.length && <p className="empty">Add books to see your collection mix.</p>}</article></section>
    <section className="panel report-table-panel"><div className="panel-heading"><div><p className="eyebrow">READER FAVORITES</p><h2>Most borrowed titles</h2></div><Link className="text-link" href="/books">View catalog →</Link></div>{popular.map((book) => <div className="popular-report-item" key={book.id}><div><strong>{book.title}</strong><span>{book.author}</span></div><span>{book.count} borrows</span></div>)}{!popular.length && <p className="empty">No borrowing history yet.</p>}</section>
  </>;
}
