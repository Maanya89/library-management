const API_URL = "http://localhost:3000/api";

document
  .querySelector("#login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const errorElement = document.querySelector("#login-error");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Login failed.");
      localStorage.setItem("libraryToken", result.token);
      window.location.href = "index.html";
    } catch (error) {
      errorElement.textContent = error.message;
    }
  });
