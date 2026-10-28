#!/usr/bin/env node
// Thin wrapper around node-pg-migrate that builds DATABASE_URL from the same PSQL_* variables the app uses.
// Usage: pnpm migrate up | down | create <name> ...
const { spawnSync } = require('child_process');
const path = require('path');
const { getDatabaseUrl } = require('./db-url');

let databaseUrl;
try {
  databaseUrl = getDatabaseUrl();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const bin = require.resolve('node-pg-migrate/bin/node-pg-migrate');
const args = ['-m', path.join(__dirname, '..', 'migrations'), ...process.argv.slice(2)];
const result = spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });
process.exit(result.status ?? 1);
