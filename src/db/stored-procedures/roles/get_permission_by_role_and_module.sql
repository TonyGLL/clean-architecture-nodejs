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
