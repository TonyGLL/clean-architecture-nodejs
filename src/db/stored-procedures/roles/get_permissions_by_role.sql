
CREATE OR REPLACE FUNCTION get_permissions_by_role(
    p_role_id INT
)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    description VARCHAR,
    permissions JSON
) AS $$
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
$$ LANGUAGE plpgsql;
