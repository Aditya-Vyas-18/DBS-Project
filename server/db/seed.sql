USE marketplace;

INSERT IGNORE INTO categories (id, parent_id, name) VALUES
  (1, NULL, 'Electronics'),
  (2, 1, 'Computers'),
  (3, 1, 'Mobile & Wearables'),
  (4, 2, 'Laptops'),
  (5, 2, 'Components'),
  (6, 3, 'Phones'),
  (7, 3, 'Accessories'),
  (8, NULL, 'Home & Living'),
  (9, 8, 'Furniture'),
  (10, 8, 'Appliances');

-- Demo user password: demo123 (bcrypt hash generated at runtime in initDb or use fixed hash)
-- Placeholder; initDb.js inserts demo user with bcrypt
