// Builds the Postgres connection string for the CLI scripts from DATABASE_URL or the PSQL_* variables the app uses.
const getDatabaseUrl = (env = process.env) => {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const { PSQL_USER, PSQL_PASSWORD, PSQL_HOST, PSQL_PORT, PSQL_DB } = env;
  if (!PSQL_USER || !PSQL_HOST || !PSQL_DB) {
    throw new Error('Set DATABASE_URL or PSQL_USER, PSQL_PASSWORD, PSQL_HOST, PSQL_PORT and PSQL_DB.');
  }
  const auth = `${encodeURIComponent(PSQL_USER)}:${encodeURIComponent(PSQL_PASSWORD ?? '')}`;
  return `postgres://${auth}@${PSQL_HOST}:${PSQL_PORT ?? 5432}/${PSQL_DB}`;
};

module.exports = { getDatabaseUrl };
