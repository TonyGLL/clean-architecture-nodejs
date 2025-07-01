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
