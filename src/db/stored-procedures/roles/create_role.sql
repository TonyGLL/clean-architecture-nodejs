
CREATE OR REPLACE FUNCTION create_role(
    p_name VARCHAR,
    p_description TEXT
)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO roles (name, description) VALUES (p_name, p_description) RETURNING r.id, r.name, r.description FROM roles r;
END;
$$ LANGUAGE plpgsql;
