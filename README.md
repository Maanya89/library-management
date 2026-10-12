# Shelfwise Library Management

Shelfwise is a library-management project with a responsive, browser-based desk for tracking books, members, and loans. The frontend is a standalone HTML, CSS, and JavaScript demo; the repository also includes an experimental Node.js/MySQL backend and SQL scripts.

## Browser demo

The frontend works without installing dependencies or running a server:

1. Open `index.html` in a browser, or open the project in VS Code and use Live Server.
2. Use the sidebar to open Overview, Books, Members, Circulation, or Reports.
3. Add books and members, record checkouts and returns, and export a CSV report.

The browser demo starts with an empty collection and saves data in that browser's `localStorage`. Data is not shared between browsers or devices, and clearing browser site data removes it. Do not store sensitive member information in the demo.

## Project contents

- `index.html`, `books.html`, `members.html`, `circulation.html`, and `reports.html` are the browser app's pages.
- `styles.css` and `app.js` contain shared styling and browser-side interactions.
- `login.html` and `login.js` are a separate login-page experiment that calls a local API.
- `library-backend/` contains an experimental Express/MySQL API. Its authentication and database integration are incomplete and must not be used with real accounts or data.
- `backend/` contains an unfinished package manifest with placeholder dependency versions; it is not currently installable.
- `database/` contains MySQL schema and sample/experimental SQL scripts. Review scripts before running them against a database.

The browser demo operates independently of both backend folders. The backend folders are included for development reference, not as a production-ready service.

## Backend experiment

The `library-backend` service expects MySQL connection settings in a local `.env` file. Do not commit that file or put real credentials in source control. The server and API are unfinished; inspect and complete their configuration and authentication before attempting to run them. The `backend` directory's `package.json` has placeholder values and does not represent a runnable service.

## Repository

- **Suggested repository name:** `shelfwise-library-management`
- **Description:** `A browser-based library desk for managing books, members, checkouts, and reports, with an experimental Node.js/MySQL backend.`
