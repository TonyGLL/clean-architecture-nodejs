import { Pool } from "pg";
import { config } from "../../config/env";
import { logger } from "../../config/winston";

const { PSQL_USER, PSQL_HOST, PSQL_DB, PSQL_PASSWORD, PSQL_PORT } = config;

const pool = new Pool({
    user: PSQL_USER,
    host: PSQL_HOST,
    database: PSQL_DB,
    password: PSQL_PASSWORD,
    port: PSQL_PORT
});

pool.on('connect', () => {
    logger.info('DB Postgresql connected');
});

export default pool;