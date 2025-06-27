
CREATE OR REPLACE FUNCTION create_role(
    p_name VARCHAR,
    p_description VARCHAR
)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    description VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO roles (name, description) VALUES (p_name, p_description) RETURNING id, name, description;
END;
$$ LANGUAGE plpgsql;
