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
