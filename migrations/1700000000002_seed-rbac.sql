-- Up Migration
-- 1. Insertar Módulos
INSERT INTO modules (name, description) VALUES
('users', 'Gestión de Usuarios'),
('roles', 'Gestión de Roles y Permisos'),
('products', 'Gestión de Productos'),
('notifications', 'Gestión de Notificaciones');

-- 2. Insertar Roles
INSERT INTO roles (name, description) VALUES
('SuperAdmin', 'Acceso total al sistema'),
('ProductManager', 'Puede gestionar productos y ver usuarios'),
('SupportAgent', 'Puede ver usuarios y gestionar notificaciones');

-- 3. Asignar Permisos a los Roles para cada Módulo
-- Administrador: todos los permisos en todos los módulos
INSERT INTO role_permissions (role_id, module_id, can_read, can_write, can_update, can_delete) VALUES
(
    (SELECT id FROM roles WHERE name = 'SuperAdmin'),
    (SELECT id FROM modules WHERE name = 'users'),
    TRUE, TRUE, TRUE, TRUE
),
((SELECT id FROM roles WHERE name = 'SuperAdmin'), (SELECT id FROM modules WHERE name = 'roles'), TRUE, TRUE, TRUE, TRUE),
((SELECT id FROM roles WHERE name = 'SuperAdmin'), (SELECT id FROM modules WHERE name = 'products'), TRUE, TRUE, TRUE, TRUE),
((SELECT id FROM roles WHERE name = 'SuperAdmin'), (SELECT id FROM modules WHERE name = 'notifications'), TRUE, TRUE, TRUE, TRUE);

-- ProductManager:
INSERT INTO role_permissions (role_id, module_id, can_read, can_write, can_update, can_delete) VALUES
((SELECT id FROM roles WHERE name = 'ProductManager'), (SELECT id FROM modules WHERE name = 'users'), TRUE, FALSE, FALSE, FALSE), -- Solo leer usuarios
((SELECT id FROM roles WHERE name = 'ProductManager'), (SELECT id FROM modules WHERE name = 'products'), TRUE, TRUE, TRUE, TRUE), -- CRUD completo en productos
((SELECT id FROM roles WHERE name = 'ProductManager'), (SELECT id FROM modules WHERE name = 'notifications'), TRUE, FALSE, FALSE, FALSE); -- Solo leer notificaciones

-- SupportAgent:
INSERT INTO role_permissions (role_id, module_id, can_read, can_write, can_update, can_delete) VALUES
((SELECT id FROM roles WHERE name = 'SupportAgent'), (SELECT id FROM modules WHERE name = 'users'), TRUE, FALSE, TRUE, FALSE), -- Leer y actualizar usuarios (ej: cambiar datos de contacto)
((SELECT id FROM roles WHERE name = 'SupportAgent'), (SELECT id FROM modules WHERE name = 'notifications'), TRUE, TRUE, FALSE, FALSE); -- Leer y crear notificaciones


-- Down Migration
DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name IN ('SuperAdmin','ProductManager','SupportAgent'));
DELETE FROM roles WHERE name IN ('SuperAdmin','ProductManager','SupportAgent');
DELETE FROM modules WHERE name IN ('users','roles','products','notifications');
