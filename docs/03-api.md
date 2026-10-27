# 3. API

Base: `/api/v1`. Dos árboles independientes:

- `/api/v1/client/*`: tienda. Autenticación: JWT de cliente.
- `/api/v1/admin/*`: panel. Autenticación: JWT de administrador **más** permiso RBAC por módulo.
- Fuera del prefijo: `/health`, `/ready`, `/metrics`, `/api/v1/stripe-webhooks` (Stripe) y las vistas EJS `/checkout`, `/add-card`, `/success`.

Leyenda de acceso: 🌐 público · 🔑 JWT cliente · 🛡️ JWT admin + permiso del módulo (el módulo es el primer segmento tras `/admin`).

## 3.1 Cliente

### Autenticación 🌐 (con rate limit: 20/15 min por IP)
| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/client/auth/register` | Alta de cliente; devuelve `{ token, userClient }` (201) |
| POST | `/client/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/client/auth/send-email` | Envía el correo de recuperación (token de 15 min) |
| POST | `/client/auth/restore-password/:token` | `{ email, password }`; el token debe ser de esa cuenta |

### Productos 🌐
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/client/products/search?search=&page=&limit=` | Búsqueda de texto completo |
| GET | `/client/products/:productId` | Detalle |
| GET | `/client/products/categories/:categoryId` | Productos por categoría |

### Carrito 🔑
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/client/cart` | Carrito con totales |
| POST | `/client/cart/add/:id` | Agrega producto `{ quantity }` |
| DELETE | `/client/cart/delete/:id` | Quita un producto |
| DELETE | `/client/cart/clear` | Vacía el carrito |
| POST | `/client/cart/address/:id` | Asigna dirección de envío |
| POST | `/client/cart/coupons/:code` | Aplica cupón |
| DELETE | `/client/cart/coupons` | Quita cupón |

### Pagos (Stripe) 🔑
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/client/payments/stripe/payment-methods` | Tarjetas guardadas |
| DELETE | `/client/payments/stripe/payment-methods/:paymentMethodId` | Elimina una tarjeta (`pm_...`) |
| POST | `/client/payments/stripe/create-setup-intent` | Inicia el guardado de una tarjeta ¹ |
| POST | `/client/payments/stripe/payment-methods` | Guarda la tarjeta tras confirmar el SetupIntent ¹ |
| POST | `/client/payments/stripe/create-payment-intent` | Crea la orden pendiente y el PaymentIntent ¹ |

¹ Requieren carrito activo con dirección de envío (`checkCartMiddleware`).

### Órdenes 🔑
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/client/orders` | Órdenes del cliente (más recientes primero) con sus productos |
| GET | `/client/orders/:id` | Detalle; una orden ajena responde 404 |

### Direcciones 🔑
`GET /client/address` · `POST /client/address` · `GET|PUT|DELETE /client/address/:id` · `PATCH /client/address/default/:id`

### Wishlists 🔑
`GET /client/wishlist` · `POST /client/wishlist` · `GET|PATCH|DELETE /client/wishlist/:id` · `POST|DELETE /client/wishlist/:id/products`

### Reseñas 🔑
`GET /client/reviews/:productId` · `POST /client/reviews/:productId` · `DELETE /client/reviews/:reviewId`

## 3.2 Administración

### Autenticación 🌐 (con rate limit)
`POST /admin/auth/login` · `POST /admin/auth/send-email` · `POST /admin/auth/restore-password/:token`

### Recursos 🛡️
| Módulo | Rutas |
| --- | --- |
| `roles` | `GET /admin/roles`, `GET /admin/roles/:id` (permisos del rol), `POST`, `PUT /:id`, `DELETE /:id` |
| `users` | `GET /admin/users`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/password`, `POST /:id/roles` |
| `catalogs` | `/admin/catalogs/modules`: `GET`, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id` |
| `reviews` | `GET /admin/reviews/:productId`, `PATCH /admin/reviews/:productId/:status` (moderar), `DELETE /admin/reviews/:reviewId` |
| `coupons` | `GET /admin/coupons`, `POST`, `PATCH /:couponId` |
| `orders` | `GET /admin/orders` (filtros `page`, `limit`, `search`, `status`, `start_date`, `end_date`), `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` con `{ "status": "processing" \| "shipped" \| "delivered" }` (solo transiciones válidas, si no 409) |

El permiso exigido depende del método: `GET→can_read`, `POST→can_write`, `PUT/PATCH→can_update`, `DELETE→can_delete`.

## 3.3 Endpoints técnicos

| Ruta | Descripción |
| --- | --- |
| `GET /health` | Liveness: `{ ok: true }` mientras el proceso responde |
| `GET /ready` | Readiness: comprueba PostgreSQL (y Redis si está configurado). 200 `{ ok: true }` o 503 `{ ok: false }` |
| `GET /metrics` | Métricas Prometheus. nginx responde 404; consúmelas desde dentro de la red |
| `POST /api/v1/stripe-webhooks` | Webhook de Stripe (cuerpo crudo y cabecera `stripe-signature`) |

## 3.4 Convenciones

**Cabeceras.** Autenticación: `Authorization: Bearer <jwt>`. Toda respuesta incluye `X-Request-Id`; si envías uno propio (8–64 caracteres `[A-Za-z0-9_-]`) se reutiliza.

**Validación.** Cada ruta declara validadores de `express-validator` (`src/infraestructure/http/validators/`). Si fallan, respuesta `422`:

```json
{ "errors": [ { "type": "field", "msg": "Field `email` must be a valid email", "path": "email", "location": "body" } ] }
```

**Errores.** Formato `{ "error": "mensaje" }`:

| Código | Cuándo |
| --- | --- |
| 400 | Credenciales incorrectas, regla de negocio incumplida (stock, cupón...) |
| 401 | Falta el token, o el administrador no tiene roles |
| 403 | Token inválido/expirado, token de reseteo mal usado, sin permiso RBAC |
| 404 | Recurso o módulo inexistente |
| 409 | Conflicto (stock insuficiente al ordenar, pago ya realizado) |
| 422 | Validación de entrada |
| 429 | Rate limit de autenticación |
| 500 | Error inesperado: `{ "error": "Server error", "requestId": "..." }`; busca ese id en los logs |

**Contraseñas.** Mínimo 8 caracteres con minúscula, mayúscula, número y símbolo (validado en registro y reseteo).

**Paginación.** Los listados aceptan `page` y `limit` (query).
