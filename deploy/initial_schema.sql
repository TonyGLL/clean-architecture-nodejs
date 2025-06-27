-- Deploy clean-architecture-nodejs:initial_schema to pg

BEGIN;

-- Tabla de clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    birth_date DATE CHECK (birth_date > '1900-01-01'),
    phone VARCHAR(20) CHECK (phone ~ '^[0-9\+\(\)\s-]{8,20}$'),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de contraseñas de clients
CREATE TABLE client_passwords (
    client_id INT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    hash CHAR(60) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    birth_date DATE CHECK (birth_date > '1900-01-01'),
    phone VARCHAR(20) CHECK (phone ~ '^[0-9\+\(\)\s-]{8,20}$'),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de contraseñas de users
CREATE TABLE passwords (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hash CHAR(60) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'Administrator', 'Editor', 'Viewer'
    description TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Módulos (Recursos de la plataforma)
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'users', 'roles', 'products', 'notifications'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Permisos por Rol y Módulo
-- Aquí se define qué puede hacer un Rol en un Módulo específico
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE, -- 'write' usualmente se refiere a 'create'
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role_id, module_id) -- Un rol solo tiene un conjunto de permisos por módulo
);

-- Tabla de Unión: Usuarios y Roles (Un usuario puede tener múltiples roles)
CREATE TABLE user_roles (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id) -- Clave primaria compuesta
);

COMMIT;
