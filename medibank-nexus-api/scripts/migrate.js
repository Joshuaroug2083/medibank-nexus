/**
 * Database Migration Runner
 * Usage:
 *   npm run db:migrate            — run all pending migrations
 *   npm run db:migrate:reset      — drop all tables and re-run from scratch (DANGER)
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';
import pg                 from 'pg';

const __dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dir, '..', 'migrations');

const pool = new pg.Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME     ?? 'medibank',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
});

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL      PRIMARY KEY,
      filename   TEXT        NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

async function getApplied(client) {
  const res = await client.query('SELECT filename FROM _migrations ORDER BY id');
  return new Set(res.rows.map(r => r.filename));
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ✓  ${file}  (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`  →  Running ${file} …`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ ${file}  applied`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ ${file}  FAILED: ${err.message}`);
        process.exit(1);
      }
    }

    if (ran === 0) {
      console.log('\n  Database is up to date. No migrations to run.\n');
    } else {
      console.log(`\n  ✅ ${ran} migration(s) applied successfully.\n`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n⚠️  RESETTING DATABASE — dropping all tables...\n');
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('  Tables dropped. Running migrations from scratch...\n');
  } finally {
    client.release();
  }
  await runMigrations();
}

const isReset = process.argv.includes('--reset');
console.log('\n🏥  MediBank Nexus — Database Migration Runner\n');

if (isReset) {
  resetDatabase().catch(err => { console.error(err); process.exit(1); });
} else {
  runMigrations().catch(err => { console.error(err); process.exit(1); });
}
