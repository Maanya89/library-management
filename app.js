const STORAGE_KEY = "shelfwise-library-demo";
const DATA_VERSION_KEY = "shelfwise-library-data-version";
const DATA_VERSION = "2";

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultState() {
  return { books: [], members: [], loans: [] };
}

function readLibraryState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = getDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return clone(initial);
  }

  try {
    const parsed = JSON.parse(raw);
    const base = getDefaultState();
    return {
      books: Array.isArray(parsed.books) ? parsed.books : base.books,
      members: Array.isArray(parsed.members) ? parsed.members : base.members,
      loans: Array.isArray(parsed.loans) ? parsed.loans : base.loans,
    };
  } catch (error) {
    console.error("Invalid library state, resetting demo data.", error);
    const initial = getDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return clone(initial);
  }
}

function saveLibraryState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function getBookAvailability(state, bookId) {
  const activeLoans = state.loans.filter((loan) => loan.bookId === bookId && loan.status === "active").length;
  const book = state.books.find((item) => item.id === bookId);
  return Math.max((book?.copies || 0) - activeLoans, 0);
}

function getMemberLoanCount(state, memberId) {
  return state.loans.filter((loan) => loan.memberId === memberId && loan.status === "active").length;
}

function setStat(key, value) {
  document.querySelectorAll(`[data-stat="${key}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderToday() {
  const today = new Date();
  document.querySelectorAll("[data-today]").forEach((element) => {
    element.textContent = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });
}

function renderDashboard() {
  const state = readLibraryState();
  const activeLoans = state.loans.filter((loan) => loan.status === "active");
  const activeMemberIds = [...new Set(activeLoans.map((loan) => loan.memberId))];
  const dueSoon = activeLoans.filter((loan) => {
    const dueDate = new Date(loan.dueDate);
    const diff = Math.ceil((dueDate - new Date()) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;

  setStat("titles", state.books.length);
  setStat("checkedOut", activeLoans.length);
  setStat("dueToday", activeLoans.filter((loan) => loan.dueDate === new Date().toISOString().slice(0, 10)).length);
  setStat("overdue", activeLoans.filter((loan) => new Date(loan.dueDate) < new Date()).length);
  setStat("activeMembers", state.members.length);
  setStat("borrowingMembers", activeMemberIds.length);
  setStat("newMembers", state.members.filter((member) => new Date(member.joined).getMonth() === new Date().getMonth() && new Date(member.joined).getFullYear() === new Date().getFullYear()).length);

  const recentActivity = document.querySelector("[data-recent-activity]");
  if (recentActivity) {
    const recent = [...state.loans]
      .sort((a, b) => new Date(b.checkedOut) - new Date(a.checkedOut))
      .slice(0, 4);

    recentActivity.innerHTML = recent.length
      ? recent
          .map((loan) => {
            const member = state.members.find((item) => item.id === loan.memberId);
            const book = state.books.find((item) => item.id === loan.bookId);
            return `
              <div class="activity-item">
                <div class="activity-book">
                  <strong>${escapeHTML(book?.title || "Unknown title")}</strong>
                  <span>${escapeHTML(member?.name || "Unknown member")}</span>
                </div>
                <span class="activity-status ${loan.status === "active" ? "status-open" : "status-closed"}">${escapeHTML(loan.status)}</span>
              </div>
            `;
          })
          .join("")
      : '<p class="empty">No recent activity yet.</p>';
  }

  const popularBooks = document.querySelector("[data-popular-books]");
  if (popularBooks) {
    const rankings = [...state.books].map((book) => ({
      ...book,
      count: state.loans.filter((loan) => loan.bookId === book.id).length,
    })).sort((a, b) => b.count - a.count).slice(0, 4);

    popularBooks.innerHTML = rankings
      .map(
        (book) => `
          <div class="popular-item">
            <div>
              <strong>${escapeHTML(book.title)}</strong>
              <span>${escapeHTML(book.author)}</span>
            </div>
            <span>${book.count} loans</span>
          </div>
        `,
      )
      .join("");
  }

  const dueList = document.querySelector("[data-due-list]");
  if (dueList) {
    const items = activeLoans
      .filter((loan) => {
        const diff = Math.ceil((new Date(loan.dueDate) - new Date()) / 86400000);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);

    dueList.innerHTML = items.length
      ? items
          .map((loan) => {
            const member = state.members.find((item) => item.id === loan.memberId);
            const book = state.books.find((item) => item.id === loan.bookId);
            return `
              <div class="due-item">
                <div>
                  <strong>${escapeHTML(book?.title || "Unknown title")}</strong>
                  <span>${escapeHTML(member?.name || "Unknown member")}</span>
                </div>
                <span>${formatDate(loan.dueDate)}</span>
              </div>
            `;
          })
          .join("")
      : '<p class="empty">Nothing due soon.</p>';
  }

  setText("[data-member-count]", `${state.members.length} members`);
  setText("[data-book-count]", `${state.books.length} titles`);

  if (dueSoon > 0) {
    setText(".due-panel .panel-heading h2", `Coming due (${dueSoon})`);
  }
}

function initializeBookOptions(state) {
  const memberSelect = document.querySelector("[data-member-options]");
  if (memberSelect) {
    memberSelect.innerHTML = '<option value="">Choose a member</option>' + state.members
      .map((member) => `<option value="${member.id}">${escapeHTML(member.name)}</option>`)
      .join("");
  }

  const bookSelect = document.querySelector("[data-available-book-options]");
  if (bookSelect) {
    bookSelect.innerHTML = '<option value="">Choose an available book</option>' + state.books
      .map((book) => {
        const available = getBookAvailability(state, book.id);
        if (available <= 0) return "";
        return `<option value="${book.id}">${escapeHTML(book.title)} (${available} available)</option>`;
      })
      .join("");
  }
}

function renderBooksPage() {
  const state = readLibraryState();
  const searchInput = document.querySelector("[data-book-search]");
  const filterSelect = document.querySelector("[data-book-filter]");
  const booksTable = document.querySelector("[data-books-table]");
  const emptyState = document.querySelector("[data-books-empty]");
  const caption = document.querySelector("[data-book-count]");

  if (!booksTable) return;

  const searchText = (searchInput?.value || "").toLowerCase().trim();
  const filterValue = filterSelect?.value || "all";

  const filteredBooks = state.books.filter((book) => {
    const matchesSearch = !searchText || `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(searchText);
    const available = getBookAvailability(state, book.id);
    const statusMatch = filterValue === "all" || (filterValue === "available" ? available > 0 : available === 0);
    return matchesSearch && statusMatch;
  });

  if (caption) caption.textContent = `${filteredBooks.length} titles`;

  booksTable.innerHTML = filteredBooks.length
    ? filteredBooks
        .map((book) => {
          const available = getBookAvailability(state, book.id);
          const statusText = available > 0 ? "Available" : "Checked out";
          return `
            <tr>
              <td>${escapeHTML(book.title)}</td>
              <td>${escapeHTML(book.author)}</td>
              <td>${escapeHTML(book.genre)}</td>
              <td>${available}/${book.copies}</td>
              <td><span class="status-badge ${available > 0 ? "status-active" : "status-closed"}">${statusText}</span></td>
            </tr>
          `;
        })
        .join("")
    : "";

  if (emptyState) {
    emptyState.classList.toggle("hidden", filteredBooks.length > 0);
    if (filteredBooks.length === 0) {
      emptyState.textContent = searchText || filterValue !== "all"
        ? "No books match your search."
        : "No books yet. Add a book to get started.";
    }
  }

  setStat("titles", state.books.length);
  setStat("availableCopies", state.books.reduce((total, book) => total + getBookAvailability(state, book.id), 0));
  setStat("checkedOut", state.loans.filter((loan) => loan.status === "active").length);
}

function renderMembersPage() {
  const state = readLibraryState();
  const searchInput = document.querySelector("[data-member-search]");
  const membersTable = document.querySelector("[data-members-table]");
  const emptyState = document.querySelector("[data-members-empty]");
  const countText = document.querySelector("[data-member-count]");

  const query = (searchInput?.value || "").toLowerCase().trim();
  const filteredMembers = state.members.filter((member) => {
    const haystack = `${member.name} ${member.email}`.toLowerCase();
    return !query || haystack.includes(query);
  });

  if (countText) countText.textContent = `${filteredMembers.length} members`;

  const activeLoans = state.loans.filter((loan) => loan.status === "active");
  setStat("activeMembers", state.members.length);
  setStat("borrowingMembers", [...new Set(activeLoans.map((loan) => loan.memberId))].length);
  setStat("newMembers", state.members.filter((member) => {
    const joined = new Date(member.joined);
    const now = new Date();
    return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
  }).length);

  if (!membersTable) return;

  membersTable.innerHTML = filteredMembers.length
    ? filteredMembers.map((member) => {
        const loanCount = getMemberLoanCount(state, member.id);
        const status = loanCount > 0 ? "Borrowing" : "Active";
        const initials = member.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

        return `
          <tr>
            <td>
              <div class="member-cell">
                <span class="member-avatar">${escapeHTML(initials)}</span>
                <span>${escapeHTML(member.name)}</span>
              </div>
            </td>
            <td>${escapeHTML(member.email)}</td>
            <td>${formatDate(member.joined)}</td>
            <td>${loanCount}</td>
            <td><span class="status-badge ${loanCount > 0 ? "status-open" : "status-active"}">${status}</span></td>
          </tr>
        `;
      }).join("")
    : "";

  if (emptyState) {
    emptyState.classList.toggle("hidden", filteredMembers.length > 0);
    if (filteredMembers.length === 0) {
      emptyState.textContent = query
        ? "No members match your search."
        : "No members yet. Add a member to get started.";
    }
  }
}

function renderCirculationPage() {
  const state = readLibraryState();
  const activeLoans = state.loans.filter((loan) => loan.status === "active");
  const filterSelect = document.querySelector("[data-loan-filter]");
  const loansTable = document.querySelector("[data-loans-table]");
  const emptyState = document.querySelector("[data-loans-empty]");

  setStat("checkedOut", activeLoans.length);
  setStat("dueToday", activeLoans.filter((loan) => loan.dueDate === new Date().toISOString().slice(0, 10)).length);
  setStat("overdue", activeLoans.filter((loan) => new Date(loan.dueDate) < new Date()).length);

  initializeBookOptions(state);

  const filterValue = filterSelect?.value || "all";
  const filteredLoans = activeLoans.filter((loan) => {
    if (filterValue === "all") return true;
    const dueDate = new Date(loan.dueDate);
    const diff = Math.ceil((dueDate - new Date()) / 86400000);
    if (filterValue === "due") return diff >= 0 && diff <= 7;
    if (filterValue === "overdue") return dueDate < new Date();
    return true;
  });

  if (loansTable) {
    loansTable.innerHTML = filteredLoans.length
      ? filteredLoans.map((loan) => {
          const member = state.members.find((item) => item.id === loan.memberId);
          const book = state.books.find((item) => item.id === loan.bookId);
          const diff = Math.ceil((new Date(loan.dueDate) - new Date()) / 86400000);
          const status = new Date(loan.dueDate) < new Date() ? "Overdue" : diff <= 7 ? "Due soon" : "On time";
          return `
            <tr>
              <td>${escapeHTML(book?.title || "Unknown title")} • ${escapeHTML(member?.name || "Unknown member")}</td>
              <td>${formatDate(loan.checkedOut)}</td>
              <td>${formatDate(loan.dueDate)}</td>
              <td><span class="status-badge ${status === "Overdue" ? "status-closed" : "status-open"}">${status}</span></td>
              <td><button type="button" class="button button-quiet" data-return-loan="${loan.id}">Return</button></td>
            </tr>
          `;
        }).join("")
      : "";
  }

  if (emptyState) {
    emptyState.classList.toggle("hidden", filteredLoans.length > 0);
  }

  bindLoanActions();

  const dueDateInput = document.querySelector("[data-default-due]");
  if (dueDateInput && !dueDateInput.value) {
    dueDateInput.value = addDays(new Date(), 14);
  }
}

function renderReportsPage() {
  const state = readLibraryState();
  const totalLoans = state.loans.length;
  const returnedLoans = state.loans.filter((loan) => loan.status === "returned").length;
  const activeLoans = state.loans.filter((loan) => loan.status === "active");
  const totalCopies = state.books.reduce((total, book) => total + book.copies, 0);

  setStat("totalLoans", totalLoans);
  setStat("returnRate", `${Math.round((returnedLoans / totalLoans) * 100) || 0}%`);
  setStat("utilization", `${Math.round((activeLoans.length / totalCopies) * 100) || 0}%`);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const byMonth = monthNames.map((label, index) => ({ label, count: state.loans.filter((loan) => {
    const date = new Date(loan.checkedOut);
    return date.getMonth() === index;
  }).length }));

  const chart = document.querySelector("[data-monthly-chart]");
  if (chart) {
    const maxCount = Math.max(...byMonth.map((month) => month.count), 1);
    chart.innerHTML = byMonth.map((month) => `
      <div class="bar-group" title="${month.count} loans in ${month.label}">
        <span class="bar" style="height: ${(month.count / maxCount) * 100}%"></span>
        <label>${month.label}</label>
      </div>
    `).join("");
  }

  const genreList = document.querySelector("[data-genre-list]");
  if (genreList) {
    const genres = state.books.reduce((list, book) => {
      list[book.genre] = (list[book.genre] || 0) + 1;
      return list;
    }, {});
    const entries = Object.entries(genres).sort((a, b) => b[1] - a[1]);
    genreList.innerHTML = entries.map(([genre, count]) => `
      <div class="genre-item">
        <span>${escapeHTML(genre)}</span>
        <strong>${count}</strong>
      </div>
    `).join("");
  }

  const reportPopular = document.querySelector("[data-report-popular]");
  if (reportPopular) {
    const popular = [...state.books]
      .map((book) => ({ ...book, count: state.loans.filter((loan) => loan.bookId === book.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    reportPopular.innerHTML = popular.map((book) => `
      <div class="popular-report-item">
        <div>
          <strong>${escapeHTML(book.title)}</strong>
          <span>${escapeHTML(book.author)}</span>
        </div>
        <span>${book.count} borrows</span>
      </div>
    `).join("");
  }
}

function attachDialogBehavior() {
  const dialogTrigger = document.querySelector("[data-open-dialog]");
  if (dialogTrigger) {
    const dialog = document.getElementById(dialogTrigger.dataset.openDialog);
    if (dialog) {
      dialogTrigger.addEventListener("click", () => dialog.showModal?.());
    }
  }

  document.querySelectorAll("dialog button[value='cancel']").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog) dialog.close();
    });
  });
}

function bindBookForm() {
  const form = document.querySelector("[data-book-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = readLibraryState();
    const formData = new FormData(form);
    const nextBook = {
      id: `book-${Date.now()}`,
      title: String(formData.get("title") || "").trim(),
      author: String(formData.get("author") || "").trim(),
      genre: String(formData.get("genre") || "").trim(),
      isbn: String(formData.get("isbn") || "").trim(),
      copies: Number(formData.get("copies") || 1),
    };

    if (!nextBook.title || !nextBook.author || !nextBook.genre) {
      alert("Please fill in the required book details.");
      return;
    }

    state.books.push(nextBook);
    saveLibraryState(state);
    form.reset();
    renderBooksPage();
    const dialog = form.closest("dialog");
    if (dialog) dialog.close();
  });
}

function bindMemberForm() {
  const form = document.querySelector("[data-member-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = readLibraryState();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!name || !email) {
      alert("Please fill in the member name and email.");
      return;
    }

    state.members.push({
      id: `member-${Date.now()}`,
      name,
      email,
      joined: new Date().toISOString().slice(0, 10),
    });
    saveLibraryState(state);
    form.reset();
    renderMembersPage();
    const dialog = form.closest("dialog");
    if (dialog) dialog.close();
  });
}

function bindCheckoutForm() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = readLibraryState();
    const formData = new FormData(form);
    const memberId = String(formData.get("memberId") || "");
    const bookId = String(formData.get("bookId") || "");
    const dueDate = String(formData.get("dueDate") || "");

    if (!memberId || !bookId || !dueDate) {
      alert("Please choose a member, a book, and a due date.");
      return;
    }

    if (getBookAvailability(state, bookId) <= 0) {
      alert("That book is not available right now.");
      return;
    }

    state.loans.push({
      id: `loan-${Date.now()}`,
      memberId,
      bookId,
      checkedOut: new Date().toISOString().slice(0, 10),
      dueDate,
      status: "active",
    });
    saveLibraryState(state);
    form.reset();
    const dueDateInput = document.querySelector("[data-default-due]");
    if (dueDateInput) dueDateInput.value = addDays(new Date(), 14);
    renderCirculationPage();
    renderDashboard();
    renderReportsPage();
  });
}

function bindLoanActions() {
  document.querySelectorAll("[data-return-loan]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = readLibraryState();
      const loan = state.loans.find((item) => item.id === button.dataset.returnLoan);
      if (!loan) return;
      loan.status = "returned";
      loan.returnedOn = new Date().toISOString().slice(0, 10);
      saveLibraryState(state);
      renderCirculationPage();
      renderDashboard();
      renderReportsPage();
    });
  });
}

function bindSearchInputs() {
  const bookSearch = document.querySelector("[data-book-search]");
  if (bookSearch) {
    bookSearch.addEventListener("input", () => renderBooksPage());
  }

  const bookFilter = document.querySelector("[data-book-filter]");
  if (bookFilter) {
    bookFilter.addEventListener("change", () => renderBooksPage());
  }

  const memberSearch = document.querySelector("[data-member-search]");
  if (memberSearch) {
    memberSearch.addEventListener("input", () => renderMembersPage());
  }

  const loanFilter = document.querySelector("[data-loan-filter]");
  if (loanFilter) {
    loanFilter.addEventListener("change", () => renderCirculationPage());
  }
}

function bindExportReport() {
  const button = document.querySelector("[data-export-report]");
  if (!button) return;

  button.addEventListener("click", () => {
    const state = readLibraryState();
    const rows = [
      ["Title", "Author", "Member", "Checked out", "Due date", "Status"],
      ...state.loans.map((loan) => {
        const book = state.books.find((item) => item.id === loan.bookId);
        const member = state.members.find((item) => item.id === loan.memberId);
        return [book?.title || "", book?.author || "", member?.name || "", loan.checkedOut, loan.dueDate, loan.status];
      }),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shelfwise-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }

  renderToday();
  attachDialogBehavior();
  bindSearchInputs();
  bindExportReport();

  const page = document.body.dataset.page;

  if (page === "dashboard") {
    renderDashboard();
  }

  if (page === "books") {
    renderBooksPage();
    bindBookForm();
  }

  if (page === "members") {
    renderMembersPage();
    bindMemberForm();
  }

  if (page === "loans") {
    renderCirculationPage();
    bindCheckoutForm();
  }

  if (page === "reports") {
    renderReportsPage();
  }

  bindLoanActions();

  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("libraryToken");
      window.location.href = "login.html";
    });
  }
});
