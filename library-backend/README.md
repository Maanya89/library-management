# Library Management System

This is a simple library management system built with Node.js and Express. The project provides APIs for user authentication, managing books, issuing books, and returning books. It uses an in-memory data store to simulate database operations.

## Project Structure

```
library-backend
├── src
│   ├── app.js                # Initializes the Express application and sets up middleware
│   ├── server.js             # Entry point for the application, starts the server
│   ├── controllers           # Contains controllers for handling business logic
│   │   ├── authController.js  # Handles user authentication
│   │   ├── bookController.js  # Manages book-related operations
│   │   └── loanController.js  # Manages book issuing and returning
│   ├── routes                # Defines API routes
│   │   ├── authRoutes.js      # Routes for user authentication
│   │   ├── bookRoutes.js      # Routes for book management
│   │   └── loanRoutes.js      # Routes for issuing and returning books
│   ├── middleware            # Contains middleware functions
│   │   └── authMiddleware.js   # Authentication checks for protected routes
│   └── services              # Contains services for data handling
│       └── inMemoryStore.js    # In-memory data store for users, books, and loans
├── package.json              # npm configuration file
└── README.md                 # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd library-backend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the server:
   ```
   npm start
   ```

## API Usage

### Authentication

- **Login User**
  - **Endpoint:** `POST /api/auth/login`
  - **Body:** `{ "username": "user", "password": "pass" }`
  - **Response:** Returns user details and authentication token.

### Book Management

- **Add Book**
  - **Endpoint:** `POST /api/books`
  - **Body:** `{ "title": "Book Title", "author": "Author Name" }`
  - **Response:** Returns the added book details.

- **Get Books**
  - **Endpoint:** `GET /api/books`
  - **Response:** Returns a list of all books.

- **Delete Book**
  - **Endpoint:** `DELETE /api/books/:id`
  - **Response:** Returns a confirmation message.

### Loan Management

- **Issue Book**
  - **Endpoint:** `POST /api/loans`
  - **Body:** `{ "userId": "user-id", "bookId": "book-id" }`
  - **Response:** Returns loan details.

- **Return Book**
  - **Endpoint:** `POST /api/loans/return`
  - **Body:** `{ "loanId": "loan-id" }`
  - **Response:** Returns confirmation of book return.

## License

This project is licensed under the MIT License.