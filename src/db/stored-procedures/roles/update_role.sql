
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
