#!/bin/bash
set -e

# Database connection details
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-root}"
DB_PASSWORD="${POSTGRES_PASSWORD:-secret}"
DB_NAME="${POSTGRES_DB:-ca_nodejs}"

# Export the password so psql can use it
export PGPASSWORD=$DB_PASSWORD

# Function to execute a SQL file
execute_sql_file() {
  local file_path=$1
  echo "Executing $file_path..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file_path"
}

# Execute the SQL scripts in the correct order
execute_sql_file "src/db/schema.sql"
execute_sql_file "src/db/inserts.sql"

# Execute all stored procedures
for file in src/db/stored-procedures/**/*.sql; do
  execute_sql_file "$file"
done

echo "Database initialization complete."
