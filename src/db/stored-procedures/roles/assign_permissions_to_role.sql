-- DROP FUNCTION public.assign_permissions_to_role(int4, json);

CREATE OR REPLACE FUNCTION public.assign_permissions_to_role(p_role_id integer, p_permissions json)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    perm json;
    module_exists BOOLEAN;
BEGIN
    FOR perm IN SELECT * FROM json_array_elements(p_permissions)
    LOOP
        -- Check if the module_id exists in the modules table
        SELECT EXISTS (
            SELECT 1 FROM modules WHERE id = (perm->>'module_id')::INT
        ) INTO module_exists;

        IF module_exists THEN
            -- Insert or update the role_permissions if the module_id exists
            INSERT INTO role_permissions (
                role_id,
                module_id,
                can_read,
                can_write,
                can_update,
                can_delete
            )
            VALUES (
                p_role_id,
                (perm->>'module_id')::INT,
                (perm->>'can_read')::BOOLEAN,
                (perm->>'can_write')::BOOLEAN,
                (perm->>'can_update')::BOOLEAN,
                (perm->>'can_delete')::BOOLEAN
            )
            ON CONFLICT (role_id, module_id)
            DO UPDATE SET
                can_read = EXCLUDED.can_read,
                can_write = EXCLUDED.can_write,
                can_update = EXCLUDED.can_update,
                can_delete = EXCLUDED.can_delete;
        ELSE
            RAISE NOTICE 'Module ID % does not exist. Skipping.', (perm->>'module_id')::INT;
        END IF;
    END LOOP;
END;
$function$
;
