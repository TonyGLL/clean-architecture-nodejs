-- DROP FUNCTION public.create_role(varchar, text);

CREATE OR REPLACE FUNCTION public.create_role(p_name character varying, p_description text)
 RETURNS TABLE(id integer, name character varying, description text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    INSERT INTO roles (name, description)
    VALUES (p_name, p_description)
    RETURNING roles.id, roles.name, roles.description;
END;
$function$
;
