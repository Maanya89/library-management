CREATE DATABASE IF NOT EXISTS library_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE library_management;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'librarian') NOT NULL DEFAULT 'librarian',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE books (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  total_copies INT UNSIGNED NOT NULL DEFAULT 1,
  available_copies INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_book_copies
    CHECK (available_copies <= total_copies)
) ENGINE=InnoDB;

CREATE TABLE loans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  book_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  issued_by BIGINT UNSIGNED NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at DATE NULL,
  returned_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('issued', 'returned') NOT NULL DEFAULT 'issued',

  INDEX idx_loans_book_id (book_id),
  INDEX idx_loans_member_id (member_id),
  INDEX idx_loans_issued_by (issued_by),
  INDEX idx_loans_status (status),

  CONSTRAINT fk_loans_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_loans_member
    FOREIGN KEY (member_id) REFERENCES members(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_loans_issued_by
    FOREIGN KEY (issued_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

