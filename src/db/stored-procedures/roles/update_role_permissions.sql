
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
