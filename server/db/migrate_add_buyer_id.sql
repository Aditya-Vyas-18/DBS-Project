-- Run once if your database was created before buyer_id existed:
-- mysql -u ... -p marketplace < server/db/migrate_add_buyer_id.sql

USE marketplace;

ALTER TABLE items
  ADD COLUMN buyer_id INT UNSIGNED NULL AFTER status,
  ADD CONSTRAINT fk_items_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE SET NULL;
