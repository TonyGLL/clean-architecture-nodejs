-- Revert clean-architecture-nodejs:initial_schema from pg

BEGIN;

DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS passwords;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS client_passwords;
DROP TABLE IF EXISTS clients;

-- The original down script also had these, which might be typos or from an older schema version.
-- I'm including them commented out for now, but they likely should be removed if not relevant.
-- DROP TABLE IF EXISTS user_permissions; -- This table is not in the UP script. role_permissions exists.
-- DROP TABLE IF EXISTS permissions; -- This table is not in the UP script. role_permissions exists.


COMMIT;
