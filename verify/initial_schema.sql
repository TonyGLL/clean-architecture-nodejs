-- Verify clean-architecture-nodejs:initial_schema on pg

BEGIN;

-- Check if tables were created
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'clients';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'client_passwords';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'users';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'passwords';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'roles';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'modules';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'role_permissions';
SELECT 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'user_roles';

ROLLBACK;
