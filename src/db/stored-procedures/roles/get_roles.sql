
CREATE OR REPLACE FUNCTION public.get_roles(page_in integer DEFAULT 0, limit_in integer DEFAULT 10, search_in text DEFAULT NULL::text)
 RETURNS TABLE(id integer, name character varying, description text, created_at timestamp with time zone, updated_at timestamp with time zone, total bigint)
 LANGUAGE plpgsql
AS $function$
DECLARE
    offset_in INT := page_in * limit_in;
    search_condition TEXT := '';
    query TEXT;
BEGIN
    -- Validaciones
    IF page_in < 0 OR limit_in <= 0 OR limit_in > 100 THEN
        RAISE EXCEPTION 'Invalid pagination parameters';
    END IF;

    -- Condición de búsqueda
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

    -- Construir query
    query := format($fmt$
        SELECT
            id,
            name,
            description,
            created_at,
            updated_at,
            COUNT(*) OVER() AS total
        FROM roles
        %s
        ORDER BY name ASC
        LIMIT %s OFFSET %s
    $fmt$, search_condition, limit_in, offset_in);

    -- Ejecutar query
    RETURN QUERY EXECUTE query;
END;
$function$
;
