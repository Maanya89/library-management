-- Insert Sample Members
INSERT INTO members (name, email, status, created_at) VALUES
('Reader One', 'reader1@example.com', 'Active', '2026-10-01 10:00:00'),
('Reader Two', 'reader2@example.com', 'Active', '2026-09-15 14:30:00'),
('Reader Three', 'reader3@example.com', 'Active', '2026-08-20 09:15:00');

-- Insert Sample Books
INSERT INTO books (title, author, total_copies, available_copies) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 5, 3),
('To Kill a Mockingbird', 'Harper Lee', 3, 2),
('1984', 'George Orwell', 4, 4);

-- Insert Active Borrowings
INSERT INTO borrowings (member_id, book_id, due_date) VALUES
(1, 1, '2026-10-17'), -- Reader One borrowed Gatsby
(1, 2, '2026-10-20'), -- Reader One borrowed Mockingbird
(2, 1, '2026-10-15'); -- Reader Two borrowed Gatsby
ALTER TABLE members 
ADD COLUMN status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active';

INSERT IGNORE INTO members (name, email, status, created_at) 
VALUES 
('Reader One', 'reader1@example.com', 'Active', '2026-10-01 10:00:00'), 
('Reader Two', 'reader2@example.com', 'Active', '2026-09-15 14:30:00'), 
('Reader Three', 'reader3@example.com', 'Active', '2026-08-20 09:15:00');

SELECT * FROM members;