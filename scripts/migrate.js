#!/usr/bin/env node
// Thin wrapper around node-pg-migrate that builds DATABASE_URL from the same PSQL_* variables the app uses.
// Usage: pnpm migrate up | down | create <name> ...
const { spawnSync } = require('child_process');
const path = require('path');

const { PSQL_USER, PSQL_PASSWORD, PSQL_HOST, PSQL_PORT, PSQL_DB } = process.env;
const env = { ...process.env };

if (!env.DATABASE_URL) {
  if (!PSQL_USER || !PSQL_HOST || !PSQL_DB) {
    console.error('Set DATABASE_URL or PSQL_USER, PSQL_PASSWORD, PSQL_HOST, PSQL_PORT and PSQL_DB.');
    process.exit(1);
  }
  const auth = `${encodeURIComponent(PSQL_USER)}:${encodeURIComponent(PSQL_PASSWORD ?? '')}`;
  env.DATABASE_URL = `postgres://${auth}@${PSQL_HOST}:${PSQL_PORT ?? 5432}/${PSQL_DB}`;
}

const bin = require.resolve('node-pg-migrate/bin/node-pg-migrate');
const args = ['-m', path.join(__dirname, '..', 'migrations'), ...process.argv.slice(2)];
const result = spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit', env });
process.exit(result.status ?? 1);
