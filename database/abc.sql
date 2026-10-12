INSERT INTO users (name, email, password_hash, role) 
VALUES ('Administrator', 'admin@example.com', '$2b$12$2lzlrZc3PjxJi0QJC1PAH..fIJNO2o7h2Js0RIHafxiIfElYwWN72', 'admin')
ON DUPLICATE KEY UPDATE password_hash = '$2b$12$2lzlrZc3PjxJi0QJC1PAH..fIJNO2o7h2Js0RIHafxiIfElYwWN72';