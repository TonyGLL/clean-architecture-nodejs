CREATE OR REPLACE FUNCTION upsert_products_with_categories(
    products_json JSON
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    product_record JSON;
    product_id_val INT;
    category_id_val INT;
    category_name_val VARCHAR(50);
    category_exists BOOLEAN;
    processed_count INTEGER := 0;
BEGIN
    -- Iterar sobre cada producto en el JSON
    FOR product_record IN SELECT * FROM json_array_elements(products_json)
    LOOP
        -- Upsert del producto
        INSERT INTO products (
            id,
            name, 
            description, 
            price, 
            stock, 
            image,
            sku,
            active
        )
        VALUES (
            (product_record->>'id')::INT,
            product_record->>'name',
            product_record->>'description',
            (product_record->>'price')::DECIMAL(10,2),
            (product_record->>'stock')::INT,
            product_record->>'image',
            product_record->>'sku',
            TRUE
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            image = EXCLUDED.image,
            sku = EXCLUDED.sku,
            updated_at = NOW()
        RETURNING id INTO product_id_val;
        
        -- Procesar la categoría
        category_name_val := product_record->>'category';
        
        -- Verificar si la categoría existe
        SELECT EXISTS(SELECT 1 FROM categories WHERE LOWER(name) = LOWER(category_name_val)) INTO category_exists;
        
        IF NOT category_exists THEN
            -- Insertar nueva categoría si no existe
            INSERT INTO categories (name, description)
            VALUES (
                INITCAP(category_name_val), -- Formatea el nombre con mayúscula inicial
                CONCAT('Productos de categoría ', INITCAP(category_name_val))
            )
            RETURNING id INTO category_id_val;
        ELSE
            -- Obtener ID de categoría existente
            SELECT id INTO category_id_val FROM categories 
            WHERE LOWER(name) = LOWER(category_name_val) LIMIT 1;
        END IF;
        
        -- Establecer relación producto-categoría (ignorar si ya existe)
        INSERT INTO product_categories (product_id, category_id)
        VALUES (product_id_val, category_id_val)
        ON CONFLICT (product_id, category_id) DO NOTHING;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$;