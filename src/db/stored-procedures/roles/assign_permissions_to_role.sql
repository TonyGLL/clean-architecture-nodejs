
CREATE OR REPLACE FUNCTION assign_permissions_to_role(
    p_role_id INT,
    p_permissions JSON
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO role_permissions (
        role_id,
        module_id,
        can_read,
        can_write,
        can_update,
        can_delete
    )
    SELECT
        p_role_id,
        (perm->>'module_id')::INT,
        (perm->>'can_read')::BOOLEAN,
        (perm->>'can_write')::BOOLEAN,
        (perm->>'can_update')::BOOLEAN,
        (perm->>'can_delete')::BOOLEAN
    FROM json_array_elements(p_permissions) perm
    ON CONFLICT (role_id, module_id)
    DO UPDATE SET
        can_read = EXCLUDED.can_read,
        can_write = EXCLUDED.can_write,
        can_update = EXCLUDED.can_update,
        can_delete = EXCLUDED.can_delete;
END;
$$ LANGUAGE plpgsql;
