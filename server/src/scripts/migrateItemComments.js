/**
 * Creates item_comments table. Safe to run more than once.
 * From server/: npm run db:migrate:comments
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
    try {
      await conn.query(`
        CREATE TABLE item_comments (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          item_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NOT NULL,
          body VARCHAR(2000) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_ic_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
          CONSTRAINT fk_ic_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);
      console.log('Created item_comments table.');
    } catch (e) {
      const errno = e.errno;
      const msg = String(e.sqlMessage || e.message || '');
      if (errno === 1050 || msg.includes('already exists')) {
        console.log('item_comments table already exists.');
      } else {
        throw e;
      }
    }

    try {
      await conn.query(
        'CREATE INDEX idx_item_comments_item ON item_comments (item_id, created_at)'
      );
    } catch (e) {
      const errno = e.errno;
      const msg = String(e.sqlMessage || e.message || '');
      if (errno === 1061 || msg.includes('Duplicate key name')) {
        /* index already there */
      } else {
        throw e;
      }
    }

    console.log('item_comments migration OK.');
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
