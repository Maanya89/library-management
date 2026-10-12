// 1. Fetch and Display Members from Database
async function fetchMembers() {
  try {
    const response = await fetch("http://localhost:3000/api/members");
    const members = await response.json();

    // Calculate metrics
    const activeCount = members.filter(
      (m) => (m.status || "Active") === "Active",
    ).length;
    const borrowingCount = members.reduce(
      (sum, m) => sum + Number(m.books_out || 0),
      0,
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = members.filter((m) => {
      const createdDate = new Date(m.created_at || m.member_since);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    }).length;

    // Update stat card DOM elements
    const activeEl = document.querySelector('[data-stat="activeMembers"]');
    const borrowingEl = document.querySelector(
      '[data-stat="borrowingMembers"]',
    );
    const newEl = document.querySelector('[data-stat="newMembers"]');
    const countCaptionEl = document.querySelector("[data-member-count]");

    if (activeEl) activeEl.textContent = activeCount;
    if (borrowingEl) borrowingEl.textContent = borrowingCount;
    if (newEl) newEl.textContent = newThisMonth;
    if (countCaptionEl)
      countCaptionEl.textContent = `${members.length} members`;

    // Populate table rows
    const tableBody = document.getElementById("member-table-body");
    if (!tableBody) return;

    if (members.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No members found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = members
      .map((m) => {
        const rawDate = m.created_at || m.member_since;
        const formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          : "N/A";

        return `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.email}</td>
          <td>${formattedDate}</td>
          <td>${m.books_out || 0}</td>
          <td>
            <span class="badge">${m.status || "Active"}</span>
          </td>
        </tr>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching members:", error);
  }
}

// 2. Handle "Add Member" Form Submission
document.addEventListener("DOMContentLoaded", () => {
  fetchMembers();

  const form = document.getElementById("add-member-form");
  const dialog = document.getElementById("member-dialog");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("input-name");
      const emailInput = document.getElementById("input-email");

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";

      if (!name || !email) return;

      try {
        const response = await fetch("http://localhost:3000/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.error || "Failed to add member.");
          return;
        }

        // Reset form, close modal, and refresh directory automatically
        form.reset();
        if (dialog) dialog.close();
        fetchMembers();
      } catch (error) {
        console.error("Error adding member:", error);
        alert(
          "Server connection error. Make sure your Node.js backend is running.",
        );
      }
    });
  }
});
