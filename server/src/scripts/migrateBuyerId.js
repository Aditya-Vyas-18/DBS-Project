/**
 * Adds items.buyer_id + FK for purchase flow. Safe to run more than once.
 * From server/: npm run db:migrate:buyer
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'marketplace';

  const conn = await mysql.createConnection({ host, port, user, password, database });

  try {
    await conn.query(`
      ALTER TABLE items
        ADD COLUMN buyer_id INT UNSIGNED NULL AFTER status,
        ADD CONSTRAINT fk_items_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE SET NULL
    `);
    console.log('Added buyer_id column and fk_items_buyer on items.');
  } catch (e) {
    const errno = e.errno;
    const msg = String(e.sqlMessage || e.message || '');
    if (errno === 1060 || msg.includes('Duplicate column name')) {
      console.log('buyer_id already exists — migration already applied.');
    } else if (errno === 1826 || msg.includes('Duplicate foreign key constraint')) {
      console.log('Foreign key fk_items_buyer already exists — nothing to do.');
    } else {
      throw e;
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
