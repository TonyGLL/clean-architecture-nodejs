-- Up Migration
-- assign_permissions_to_role.sql
-- DROP FUNCTION public.assign_permissions_to_role(int4, json);

CREATE OR REPLACE FUNCTION public.assign_permissions_to_role(p_role_id integer, p_permissions json)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    perm json;
    module_exists BOOLEAN;
BEGIN
    FOR perm IN SELECT * FROM json_array_elements(p_permissions)
    LOOP
        -- Check if the module_id exists in the modules table
        SELECT EXISTS (
            SELECT 1 FROM modules WHERE id = (perm->>'module_id')::INT
        ) INTO module_exists;

        IF module_exists THEN
            -- Insert or update the role_permissions if the module_id exists
            INSERT INTO role_permissions (
                role_id,
                module_id,
                can_read,
                can_write,
                can_update,
                can_delete
            )
            VALUES (
                p_role_id,
                (perm->>'module_id')::INT,
                (perm->>'can_read')::BOOLEAN,
                (perm->>'can_write')::BOOLEAN,
                (perm->>'can_update')::BOOLEAN,
                (perm->>'can_delete')::BOOLEAN
            )
            ON CONFLICT (role_id, module_id)
            DO UPDATE SET
                can_read = EXCLUDED.can_read,
                can_write = EXCLUDED.can_write,
                can_update = EXCLUDED.can_update,
                can_delete = EXCLUDED.can_delete;
        ELSE
            RAISE NOTICE 'Module ID % does not exist. Skipping.', (perm->>'module_id')::INT;
        END IF;
    END LOOP;
END;
$function$
;

-- create_role.sql
-- DROP FUNCTION public.create_role(varchar, text);

CREATE OR REPLACE FUNCTION public.create_role(p_name character varying, p_description text)
 RETURNS TABLE(id integer, name character varying, description text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    INSERT INTO roles (name, description)
    VALUES (p_name, p_description)
    RETURNING roles.id, roles.name, roles.description;
END;
$function$
;

-- delete_role.sql

CREATE OR REPLACE FUNCTION delete_role(
    p_role_id INT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM roles WHERE id = p_role_id;
END;
$$ LANGUAGE plpgsql;

-- get_permission_by_role_and_module.sql
-- DROP FUNCTION public.get_permission_by_role_and_module(int4, int4);

CREATE OR REPLACE FUNCTION public.get_permission_by_role_and_module(p_role_id integer, p_module_id integer)
 RETURNS TABLE(role_id integer, module_id integer, can_read boolean, can_write boolean, can_update boolean, can_delete boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        rp.role_id,
        rp.module_id,
        COALESCE(rp.can_read, false) as can_read,
        COALESCE(rp.can_write, false) as can_write,
        COALESCE(rp.can_update, false) as can_update,
        COALESCE(rp.can_delete, false) as can_delete
    FROM role_permissions rp
    WHERE rp.role_id = p_role_id AND rp.module_id = p_module_id;
END;
$function$
;

-- get_permissions_by_role.sql
-- DROP FUNCTION public.get_permissions_by_role(int4);

CREATE OR REPLACE FUNCTION public.get_permissions_by_role(p_role_id integer)
 RETURNS TABLE(id integer, name character varying, description text, permissions json)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.description,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'module_id', m.id,
                        'module_name', m.name,
                        'can_write', COALESCE(rp.can_write, false),
                        'can_update', COALESCE(rp.can_update, false),
                        'can_read', COALESCE(rp.can_read, false),
                        'can_delete', COALESCE(rp.can_delete, false)
                    )
                )
                FROM role_permissions rp
                JOIN modules m ON rp.module_id = m.id
                WHERE rp.role_id = r.id
            ),
            '[]'::json
        ) as permissions
    FROM roles r
    WHERE r.id = p_role_id;
END;
$function$
;

-- get_roles.sql
-- DROP FUNCTION public.get_roles(int4, int4, text);

CREATE OR REPLACE FUNCTION public.get_roles(page_in integer DEFAULT 0, limit_in integer DEFAULT 10, search_in text DEFAULT NULL::text)
 RETURNS TABLE(roles json, total bigint)
 LANGUAGE plpgsql
AS $function$
DECLARE
    offset_in INT := page_in * limit_in;
    search_condition TEXT := '';
BEGIN
    -- Validaciones
    IF page_in < 0 OR limit_in <= 0 OR limit_in > 100 THEN
        RAISE EXCEPTION 'Invalid pagination parameters';
    END IF;

    -- Construir condición búsqueda
    IF search_in IS NOT NULL THEN
        IF search_in ~ '^\d+$' THEN
            search_condition := format(
                'WHERE id = %L OR name ILIKE %L',
                search_in::INT,
                '%' || search_in || '%'
            );
        ELSE
            search_condition := format(
                'WHERE name ILIKE %L',
                '%' || search_in || '%'
            );
        END IF;
    END IF;

    RETURN QUERY EXECUTE format($fmt$
        WITH roles_data AS (
            SELECT
                id,
                name,
                description,
                created_at,
                updated_at
            FROM roles
            %s
            ORDER BY name ASC
            LIMIT %s OFFSET %s
        ),
        total_count AS (
            SELECT COUNT(*) AS total FROM roles %s
        )
        SELECT
            (SELECT json_agg(row_to_json(r)) FROM roles_data r) AS roles,
            (SELECT total FROM total_count) AS total;
    $fmt$, search_condition, limit_in, offset_in, search_condition);
END;
$function$
;

-- update_role_permissions.sql

CREATE OR REPLACE FUNCTION update_role_permissions(
    p_role_id INT,
    p_permissions JSON
)
RETURNS VOID AS $$
BEGIN
    UPDATE role_permissions AS rp
    SET
        can_read = (v->>'can_read')::BOOLEAN,
        can_write = (v->>'can_write')::BOOLEAN,
        can_update = (v->>'can_update')::BOOLEAN,
        can_delete = (v->>'can_delete')::BOOLEAN
    FROM json_array_elements(p_permissions) AS v
    WHERE rp.role_id = p_role_id AND rp.module_id = (v->>'module_id')::INT;
END;
$$ LANGUAGE plpgsql;

-- update_role.sql

CREATE OR REPLACE FUNCTION update_role(
    p_role_id INT,
    p_name VARCHAR,
    p_description VARCHAR
)
RETURNS VOID AS $$
BEGIN
    UPDATE roles SET name = p_name, description = p_description WHERE id = p_role_id;
END;
$$ LANGUAGE plpgsql;

-- upsert_products_with_categories.sql
CREATE OR REPLACE FUNCTION upsert_products_with_categories(
    products_json JSON
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    product_record JSON;
    product_id_val INT;
    category_id_val INT;
    category_name_val VARCHAR(50);
    category_exists BOOLEAN;
    processed_count INTEGER := 0;
BEGIN
    -- Iterar sobre cada producto en el JSON
    FOR product_record IN SELECT * FROM json_array_elements(products_json)
    LOOP
        -- Upsert del producto
        INSERT INTO products (
            id,
            name, 
            description, 
            price, 
            stock, 
            image,
            sku,
            active
        )
        VALUES (
            (product_record->>'id')::INT,
            product_record->>'name',
            product_record->>'description',
            (product_record->>'price')::DECIMAL(10,2),
            (product_record->>'stock')::INT,
            product_record->>'image',
            product_record->>'sku',
            TRUE
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            image = EXCLUDED.image,
            sku = EXCLUDED.sku,
            updated_at = NOW()
        RETURNING id INTO product_id_val;
        
        -- Procesar la categoría
        category_name_val := product_record->>'category';
        
        -- Verificar si la categoría existe
        SELECT EXISTS(SELECT 1 FROM categories WHERE LOWER(name) = LOWER(category_name_val)) INTO category_exists;
        
        IF NOT category_exists THEN
            -- Insertar nueva categoría si no existe
            INSERT INTO categories (name, description)
            VALUES (
                INITCAP(category_name_val), -- Formatea el nombre con mayúscula inicial
                CONCAT('Productos de categoría ', INITCAP(category_name_val))
            )
            RETURNING id INTO category_id_val;
        ELSE
            -- Obtener ID de categoría existente
            SELECT id INTO category_id_val FROM categories 
            WHERE LOWER(name) = LOWER(category_name_val) LIMIT 1;
        END IF;
        
        -- Establecer relación producto-categoría (ignorar si ya existe)
        INSERT INTO product_categories (product_id, category_id)
        VALUES (product_id_val, category_id_val)
        ON CONFLICT (product_id, category_id) DO NOTHING;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$;
-- Down Migration
-- Stored procedures are replaced by later migrations; nothing to undo.
