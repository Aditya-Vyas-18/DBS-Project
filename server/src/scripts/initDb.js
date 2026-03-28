/**
 * Creates schema, seeds categories, and demo users. Run: npm run db:init (from server/)
 * Requires MySQL running and .env configured.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'marketplace';

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });

  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  const seedPath = path.join(__dirname, '../../db/seed.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const seed = fs.readFileSync(seedPath, 'utf8');

  console.log('Applying schema...');
  await conn.query(schema);
  console.log('Seeding categories...');
  await conn.query(seed);

  await conn.query('USE ??', [database]);

  const demoHash = await bcrypt.hash('demo123', 10);
  await conn.query(
    `INSERT IGNORE INTO users (id, email, password_hash, display_name) VALUES
     (1, 'alice@demo.local', ?, 'Alice Seller'),
     (2, 'bob@demo.local', ?, 'Bob Buyer')`,
    [demoHash, demoHash]
  );

  console.log('Demo users (password demo123): alice@demo.local, bob@demo.local');
  await conn.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
