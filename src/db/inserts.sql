      
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

-- 4. Asignar Roles a Usuarios (asumiendo que ya tienes usuarios en la tabla `users`)
-- Supongamos que el usuario con id 1 es un Administrador
INSERT INTO user_roles (user_id, role_id) VALUES
(1, (SELECT id FROM roles WHERE name = 'Administrator'));

-- Supongamos que el usuario con id 2 es un ProductManager
INSERT INTO user_roles (user_id, role_id) VALUES
(2, (SELECT id FROM roles WHERE name = 'ProductManager'));

-- Supongamos que el usuario con id 3 es un SupportAgent y también puede ver productos (asignamos dos roles)
INSERT INTO user_roles (user_id, role_id) VALUES
(3, (SELECT id FROM roles WHERE name = 'SupportAgent'));
-- Si el SupportAgent necesita ver productos, se podría crear un rol "ProductViewer"
-- o darle explícitamente permisos al rol 'SupportAgent' sobre el módulo 'products'
-- Por ejemplo, si queremos que SupportAgent también lea productos:
-- INSERT INTO role_permissions (role_id, module_id, can_read) VALUES
-- ((SELECT id FROM roles WHERE name = 'SupportAgent'), (SELECT id FROM modules WHERE name = 'products'), TRUE);
-- Si un usuario tiene múltiples roles, sus permisos se "suman" (generalmente se toma el permiso más permisivo).