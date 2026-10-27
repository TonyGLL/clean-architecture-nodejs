-- Up Migration
-- permissionsMiddleware resolves the module from the first URL segment of /api/v1/admin/*.
-- The original seed lacked the modules behind the catalogs, reviews, coupons and orders routes,
-- so those endpoints answered 404 "Module not found" even for SuperAdmin.
INSERT INTO modules (name, description) VALUES
('catalogs', 'Gestión de Catálogos'),
('reviews', 'Moderación de Reseñas'),
('coupons', 'Gestión de Cupones'),
('orders', 'Gestión de Órdenes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, module_id, can_read, can_write, can_update, can_delete)
SELECT r.id, m.id, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN modules m
WHERE r.name = 'SuperAdmin' AND m.name IN ('catalogs', 'reviews', 'coupons', 'orders')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Down Migration
DELETE FROM role_permissions WHERE module_id IN (SELECT id FROM modules WHERE name IN ('catalogs', 'reviews', 'coupons', 'orders'));
DELETE FROM modules WHERE name IN ('catalogs', 'reviews', 'coupons', 'orders');
