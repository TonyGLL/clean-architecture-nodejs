# 6. Limitaciones conocidas y hoja de ruta

Esta lista es deliberadamente honesta: son cosas que hoy **no** funcionan como cabría esperar o que conviene resolver antes de producción. Cada punto indica dónde mirar.

## 6.1 Limitaciones y deuda técnica

### Seguridad
| # | Tema | Detalle |
| --- | --- | --- |
| S1 | Vista `/checkout` sin autenticación | `views.routes.ts` usa `clientId = 1` fijo y lista sus tarjetas (marca, últimos 4 y ids de Stripe) a cualquiera. Es una página de pruebas de Stripe.js; no debe exponerse tal cual en un entorno real |
| S2 | Vista `/success` sin plantilla | Renderiza `success`, pero `src/views/` solo tiene `checkout` y `add-card`: responde 500 |
| S3 | Sesiones | JWT de 1 hora, sin *refresh token* ni revocación/cierre de sesión. Los roles de un admin viajan en el token y no se refrescan hasta volver a iniciar sesión |
| S4 | Rate limit parcial | Solo protege las rutas de autenticación; el resto de la API no tiene límite |
| S5 | Sin TLS en nginx | `nginx.conf` escucha en el puerto 80 y envía HSTS, pero no termina TLS. Hazlo en el balanceador de la nube o añade certificados |
| S6 | Token de reseteo en el cuerpo del correo | El correo contiene el token en texto, no un enlace |
| S7 | Credenciales por defecto | `docker-compose.yml` usa `root`/`secret` como valores por defecto de desarrollo; sobrescríbelos con variables de entorno y no los uses fuera de local |

### Funcionalidad
| # | Tema | Detalle |
| --- | --- | --- |
| F1 | El stock se reserva al crear el PaymentIntent y no se libera | La orden `pending` y el descuento de stock ocurren en `create-payment-intent`. Si el cliente abandona o el pago falla, el stock queda descontado y la orden pendiente para siempre (`payment_failed` solo registra un log). Hace falta un trabajo en el worker que cancele órdenes pendientes caducadas y reponga stock |
| F2 | Órdenes sin dirección | `createOrder` recibe `shippingAddress` y `billingAddress` como cadenas vacías, así que la orden no guarda una copia de la dirección de envío |
| F3 | Casos de uso sin ruta | `GetOrderByIdUseCase`, `GetClientOrdersUseCase` y `UpdateOrderStatusUseCase` están registrados pero no tienen controlador ni ruta: los clientes no pueden consultar sus órdenes y los administradores solo pueden listarlas (`GET /admin/orders`) |
| F4 | Cupones incompletos | `max_discount`, `valid_from` y `active` existen en la tabla pero no se validan al aplicar; un cupón de monto fijo puede superar el subtotal y dejar un total no positivo (Stripe rechazaría el cobro) |
| F5 | Primer administrador | Ninguna migración ni script crea el primer usuario administrador; hay que insertarlo a mano (hash bcrypt en `passwords` + fila en `user_roles`) |
| F6 | Módulo `products` sin rutas admin | El módulo y sus permisos existen, pero no hay endpoints administrativos de productos (el catálogo viene del cron) |
| F7 | Divisa e impuestos fijos | IVA de 16 % y envío de 40 en la entidad `Cart`; la divisa llega del DTO del pago |
| F8 | Catálogo de demostración | Los productos vienen de `fakestoreapi.com`; no hay gestión propia de productos ni subida de imágenes |

### Calidad y mantenimiento
| # | Tema | Detalle |
| --- | --- | --- |
| Q1 | Cobertura de pruebas | Hay pruebas unitarias de autenticación, permisos, webhook, rate limit y contexto de petición, pero no pruebas de integración contra Postgres: los repositorios y las funciones SQL no están cubiertos |
| Q2 | Reglas de lint en *warning* | 14 avisos pendientes (`try/catch` redundantes, errores sin `cause`, variables sin usar) |
| Q3 | Mezcla de capas en casos de uso | Los casos de uso manejan `Pool` y transacciones directamente. Una abstracción de *unit of work* en `domain/` lo limpiaría |
| Q4 | Dependencia sin uso | `@types/bun` en `devDependencies` |
| Q5 | Objetivo de compilación | TypeScript compila a ES2016/CommonJS |

## 6.2 Hoja de ruta sugerida

Orden recomendado, de lo que desbloquea más a lo que pule:

1. **Cerrar el ciclo de vida de la orden** (F1, F2, F3): trabajo en el worker que caduca reservas, endpoints de órdenes para clientes y de cambio de estado para admin, y copia de la dirección en la orden.
2. **Primer admin reproducible** (F5): script `scripts/create-admin.js` que lea email y contraseña de variables de entorno.
3. **Decidir qué hacer con las vistas EJS** (S1, S2): protegerlas con el JWT, deshabilitarlas en producción o sustituirlas por un front real.
4. **Sesiones** (S3): *refresh tokens* con rotación guardados en Redis o Postgres y endpoint de logout.
5. **Reglas de cupones completas** (F4).
6. **Pruebas de integración con Testcontainers** (Q1): repositorios y migraciones sobre un Postgres real, incluida la prueba `up → down → up`.
7. **Imágenes de producto en almacenamiento de objetos** (F8): URLs prefirmadas (S3 o equivalente).
8. **Trazas con OpenTelemetry** sobre el `X-Request-Id` y las métricas ya existentes.

## 6.3 Hoja de ruta hacia cloud

El proyecto ya está preparado para contenedores: configuración por entorno, procesos separados (API / worker / migración), probes de liveness y readiness, logs JSON por stdout, métricas Prometheus y apagado ordenado. Equivalencias propuestas (ejemplo en AWS; el patrón es el mismo en GCP/Azure):

| Pieza del proyecto | Servicio gestionado |
| --- | --- |
| Imagen Docker | Registro de contenedores (ECR) |
| API (`app_dev`) | ECS Fargate / Kubernetes detrás de un balanceador, con `/ready` como *target health check* |
| Worker | Servicio separado con 1+ réplicas (el advisory lock evita duplicar el cron) |
| `migrate` | Tarea de un solo uso ejecutada antes de cada despliegue |
| PostgreSQL | Base gestionada (RDS/Cloud SQL) en subred privada |
| Redis | Redis gestionado (ElastiCache/Memorystore) |
| `dev.env` | Gestor de secretos (Secrets Manager / Parameter Store) inyectado como variables |
| nginx | Balanceador de aplicación (TLS, HSTS, enrutamiento); `/metrics` solo en red privada |
| Logs JSON por stdout | Agente de logs del orquestador (CloudWatch Logs) |
| `/metrics` | Prometheus gestionado o *scraper* del agente de métricas |
| CI | GitHub Actions: *build* → pruebas → publicar imagen con OIDC → desplegar |
| Webhook de Stripe | Endpoint HTTPS público del balanceador apuntando a `/api/v1/stripe-webhooks` |

Pasos prácticos sugeridos para tu práctica: (1) Terraform para red + RDS + Redis + ECR; (2) definición de servicios API/worker/migración; (3) secretos fuera del código; (4) pipeline de despliegue con *rollback*; (5) alarmas sobre `/ready`, latencia p95 de `http_request_duration_seconds` y errores 5xx; (6) pruebas de carga para dimensionar réplicas y conexiones del pool de Postgres.
