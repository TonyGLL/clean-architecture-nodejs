-- Tabla de recursos (módulos del sistema)
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- Ej: 'users', 'products', 'orders'
    description TEXT
);

-- Tabla de acciones disponibles
CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,  -- Ej: 'read', 'write', 'update', 'delete'
    description TEXT
);

-- Tabla de permisos (combinación recurso-acción)
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    action_id INT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    UNIQUE (resource_id, action_id)  -- Evitar duplicados
);

-- Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_superadmin BOOLEAN DEFAULT FALSE  -- Rol con todos los permisos
);

-- Tabla de relación roles-permisos
CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    birth_date DATE CHECK (birth_date > '1900-01-01'),
    phone VARCHAR(20) CHECK (phone ~ '^[0-9\+\(\)\s-]{8,20}$'),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuarios-roles (M:N)
CREATE TABLE user_roles (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tabla de contraseñas
CREATE TABLE passwords (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hash CHAR(60) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION check_permission(
    user_id INT,
    resource_name VARCHAR,
    action_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    is_superadmin BOOLEAN;
    explicit_grant BOOLEAN;
    has_role_permission BOOLEAN;
BEGIN
    -- Verificar si es superadmin
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = check_permission.user_id
        AND r.is_superadmin = TRUE
    ) INTO is_superadmin;
    
    IF is_superadmin THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permiso explícito
    SELECT granted INTO explicit_grant
    JOIN permissions p ON up.permission_id = p.id
    JOIN resources res ON p.resource_id = res.id
    JOIN actions act ON p.action_id = act.id
    WHERE up.user_id = check_permission.user_id
    AND res.name = resource_name
    AND act.name = action_name;
    
    IF FOUND THEN
        RETURN explicit_grant;
    END IF;
    
    -- Verificar permisos vía roles
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        JOIN resources res ON p.resource_id = res.id
        JOIN actions act ON p.action_id = act.id
        WHERE ur.user_id = check_permission.user_id
        AND res.name = resource_name
        AND act.name = action_name
    ) INTO has_role_permission;
    
    RETURN has_role_permission;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática de timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_passwords_timestamp
BEFORE UPDATE ON passwords
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);






-- Insertar recursos iniciales
INSERT INTO resources (name, description) VALUES
('users', 'Gestión de usuarios del sistema'),
('products', 'Catálogo de productos'),
('orders', 'Gestión de pedidos');

-- Insertar acciones disponibles
INSERT INTO actions (name, description) VALUES
('read', 'Permite ver contenido'),
('write', 'Permite crear nuevos elementos'),
('update', 'Permite modificar elementos existentes'),
('delete', 'Permite eliminar elementos');

-- Crear todos los permisos posibles (combinación recurso-acción)
INSERT INTO permissions (resource_id, action_id)
SELECT r.id, a.id
FROM resources r
CROSS JOIN actions a;

-- Crear rol SuperAdmin
INSERT INTO roles (name, is_superadmin) VALUES ('SuperAdmin', TRUE);

-- Crear usuario SuperAdmin
INSERT INTO users (
    "name", 
    last_name, 
    email, 
    birth_date, 
    phone
) VALUES (
    'Admin', 
    'Principal', 
    'superadmin@empresa.com', 
    '1980-01-01', 
    '+1-555-123456'
) RETURNING id;

-- Asignar rol SuperAdmin al usuario
INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'superadmin@empresa.com'),
    (SELECT id FROM roles WHERE name = 'SuperAdmin')
);

-- Crear contraseña para SuperAdmin (ejemplo: "Password123")
INSERT INTO passwords (user_id, hash)
VALUES (
    (SELECT id FROM users WHERE email = 'superadmin@empresa.com'),
    '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- bcrypt para "Password123"
);

-- Crear rol básico para usuarios normales
INSERT INTO roles (name) VALUES ('Usuario Básico');

-- Asignar permisos de solo lectura al rol básico
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Usuario Básico'),
    p.id
FROM permissions p
JOIN resources r ON p.resource_id = r.id
JOIN actions a ON p.action_id = a.id
WHERE a.name = 'read';

-- Crear rol avanzado para editores
INSERT INTO roles (name) VALUES ('Editor Avanzado');

-- Asignar permisos de lectura y escritura al rol editor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'Editor Avanzado'),
    p.id
FROM permissions p
JOIN resources r ON p.resource_id = r.id
JOIN actions a ON p.action_id = a.id
WHERE a.name IN ('read', 'write', 'update');