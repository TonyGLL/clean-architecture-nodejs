#!/usr/bin/env node
// Creates (or repairs) the first administrator with the SuperAdmin role. Run the migrations first.
//
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='S3cure!pass' pnpm create-admin
//
// Credentials come from environment variables, not arguments, so they stay out of shell history and `ps`.
// Optional: ADMIN_NAME, ADMIN_LAST_NAME, ADMIN_ROLE (default SuperAdmin), ADMIN_RESET_PASSWORD=true.
// Idempotent: if the email already exists, the role is (re)assigned and the password is kept
// unless ADMIN_RESET_PASSWORD=true.
const { Client } = require('pg');
const { hash } = require('bcryptjs');
const { getDatabaseUrl } = require('./db-url');

// Same rules as the API validators (auth.validator.ts)
const validatePassword = (password) => {
  const problems = [];
  if (!password || password.length < 8) problems.push('at least 8 characters');
  if (!/[a-z]/.test(password || '')) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password || '')) problems.push('an uppercase letter');
  if (!/[0-9]/.test(password || '')) problems.push('a number');
  if (!/[^A-Za-z0-9]/.test(password || '')) problems.push('a symbol');
  return problems;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

/**
 * @param {import('pg').ClientBase} client
 * @returns {Promise<{ userId: number, created: boolean, passwordSet: boolean, role: string }>}
 */
const createAdmin = async (client, { email, password, name = 'Admin', lastName = 'Admin', role = 'SuperAdmin', resetPassword = false }) => {
  if (!validateEmail(email)) throw new Error('ADMIN_EMAIL must be a valid email.');
  const problems = validatePassword(password);
  if (problems.length) throw new Error(`ADMIN_PASSWORD must contain ${problems.join(', ')}.`);

  const normalizedEmail = email.trim().toLowerCase();

  await client.query('BEGIN');
  try {
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1 AND deleted = FALSE', [role]);
    if (roleResult.rowCount === 0) throw new Error(`Role '${role}' not found. Run "pnpm migrate up" first.`);
    const roleId = roleResult.rows[0].id;

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    const created = existing.rowCount === 0;
    let userId;
    if (created) {
      const inserted = await client.query(
        'INSERT INTO users (name, last_name, email) VALUES ($1, $2, $3) RETURNING id',
        [name, lastName, normalizedEmail]
      );
      userId = inserted.rows[0].id;
    } else {
      userId = existing.rows[0].id;
    }

    const passwordSet = created || resetPassword;
    if (passwordSet) {
      await client.query(
        'INSERT INTO passwords (user_id, hash) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET hash = $2, updated_at = NOW()',
        [userId, await hash(password, 10)]
      );
    }

    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, roleId]);
    await client.query('COMMIT');
    return { userId, created, passwordSet, role };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const main = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_LAST_NAME, ADMIN_ROLE, ADMIN_RESET_PASSWORD } = process.env;
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const result = await createAdmin(client, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME || undefined,
      lastName: ADMIN_LAST_NAME || undefined,
      role: ADMIN_ROLE || undefined,
      resetPassword: ADMIN_RESET_PASSWORD === 'true',
    });
    console.log(
      `${result.created ? 'Created' : 'Found existing'} admin ${ADMIN_EMAIL} (id ${result.userId}) with role ${result.role}.` +
      (result.passwordSet ? ' Password set.' : ' Existing password kept (set ADMIN_RESET_PASSWORD=true to replace it).')
    );
  } finally {
    await client.end();
  }
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`create-admin failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { createAdmin, validatePassword, validateEmail };
