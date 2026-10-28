# 5. Operación

## 5.1 Variables de entorno

Se validan con zod al arrancar (`src/infraestructure/config/env.ts`); si falta una obligatoria, el proceso termina con un mensaje claro. En Compose se leen de `dev.env` (no versionado; nunca lo subas).

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `PORT` | no (3000) | Puerto de la API |
| `JWT_SECRET_CLIENT`, `JWT_SECRET_ADMIN` | sí | Secretos de firma; deben ser distintos |
| `PSQL_HOST`, `PSQL_PORT`, `PSQL_USER`, `PSQL_PASSWORD`, `PSQL_DB` | sí | Conexión a PostgreSQL (en Compose `PSQL_HOST=db`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | sí | Envío de correo (`secure` se activa con puerto 465) |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` | sí | Credenciales de Stripe |
| `REDIS_URL` | no | Activa cola de correos y rate limit compartido (`redis://redis:6379` en Compose) |
| `ENABLE_DEMO_VIEWS` | no (`false`) | `true` sirve las páginas de demostración de Stripe.js (`/checkout`, `/add-card`, `/success`). Mantenlo apagado fuera de local |
| `ORDER_RESERVATION_MINUTES` | no (30, mínimo 5) | Minutos que una orden sin pagar retiene stock antes de que el worker la cancele |
| `CORS_ORIGIN` | no (`http://localhost:4200`) | Origen permitido por CORS |
| `LOG_LEVEL` | no | `debug` por defecto en desarrollo, `info` en producción |
| `LOG_TO_FILE` | no | `true` para escribir además archivos rotativos en `logs/` |
| `NODE_ENV` | no | `production` activa logs JSON y formato de acceso compacto |

Para `scripts/migrate.js` basta con las `PSQL_*` o con `DATABASE_URL`.

## 5.2 Comandos

```bash
pnpm install --frozen-lockfile   # instalación reproducible
pnpm dev                         # API con nodemon + ts-node
pnpm dev:worker                  # worker con ts-node
pnpm build && pnpm start         # compilar (tsc + copia de src/views a dist/views) y ejecutar la API
pnpm worker                      # ejecutar el worker compilado
pnpm migrate up                  # migraciones
ADMIN_EMAIL=… ADMIN_PASSWORD=… pnpm create-admin   # primer administrador
pnpm typecheck && pnpm lint && pnpm test
pnpm jest ruta/al/test.ts -t "nombre"   # un solo test
docker-compose up --build -d     # stack completo
```

pnpm está fijado en `packageManager` y los scripts nativos de dependencias están desactivados en `pnpm-workspace.yaml` (`allowBuilds`). pnpm es estricto: todo paquete importado (incluidos los `@types/*`) debe estar declarado en `package.json`.

### Primer administrador

`scripts/create-admin.js` crea un usuario con el rol `SuperAdmin` (requiere haber ejecutado las migraciones). Lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` del entorno (no de argumentos, para que no queden en el historial del shell ni en `ps`); opcionales: `ADMIN_NAME`, `ADMIN_LAST_NAME`, `ADMIN_ROLE` y `ADMIN_RESET_PASSWORD=true`. La contraseña se valida con las mismas reglas de la API (8+ caracteres, minúscula, mayúscula, número y símbolo) y se guarda con bcrypt. Es **idempotente**: si el correo ya existe, vuelve a asignar el rol y conserva la contraseña salvo que pidas el reseteo. Todo ocurre en una transacción. En Compose: `docker compose run --rm -e ADMIN_EMAIL=… -e ADMIN_PASSWORD=… migrate node scripts/create-admin.js`. Usa las mismas variables `PSQL_*` (o `DATABASE_URL`) que `scripts/migrate.js`.

## 5.3 Docker

`Dockerfile` en tres etapas: *builder* (instala y compila), *production-deps* (solo dependencias de producción con lockfile congelado) y *runner* (imagen final). La imagen final:

- corre como el usuario sin privilegios `node`;
- contiene `dist/`, `node_modules` de producción, `migrations/` y los scripts `scripts/migrate.js` y `scripts/create-admin.js`;
- incluye un `HEALTHCHECK` contra `/health`;
- arranca la API por defecto; el worker usa `command: node dist/main/worker.js`.

`docker-compose.yml` define: `db`, `redis`, `migrate` (one-off), `app_dev`, `worker` y `nginx`. Los datos de Postgres persisten en el volumen `postgres_data`. El puerto 5432 solo se publica en `127.0.0.1`. Las credenciales de Postgres del compose se pueden sobrescribir con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` (valores por defecto de desarrollo: `root` / `secret` / `ca_nodejs`).

## 5.4 Salud, métricas y trazabilidad

| Mecanismo | Detalle |
| --- | --- |
| `/health` | Liveness. Úsalo para reiniciar contenedores colgados |
| `/ready` | Readiness: `SELECT 1` en Postgres y `PING` a Redis (con tope de 2 s). 503 si algo falla. Úsalo para sacar la instancia del balanceador |
| `/metrics` | Prometheus: `http_request_duration_seconds{method,route,status}` (la ruta es el patrón, no la URL real) más métricas por defecto del proceso. No se expone por nginx |
| `X-Request-Id` | Se genera (o se reutiliza el entrante), se devuelve en la respuesta, se incluye en cada línea de log (`requestId`) y en el cuerpo de los 500 |
| Logs | winston. En producción: JSON por stdout (listo para CloudWatch, Loki, etc.). En desarrollo: texto con colores. Archivos rotativos solo con `LOG_TO_FILE=true` |

Apagado ordenado: la API y el worker atienden `SIGTERM` y `SIGINT`; la API cierra el servidor, la cola, Redis y el pool (tope de 10 s), y el worker detiene el cron y el consumidor.

## 5.5 CI

`.github/workflows/ci.yml` se ejecuta en cada push a `main` y en cada PR: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test`, y un job que construye la imagen Docker.

## 5.6 Pruebas

Jest + ts-jest, tests en `src/__tests__/`. Los casos de uso se prueban con dependencias simuladas; los middlewares (permisos, autenticación, rate limit, contexto de petición) y el controlador del webhook también. No hay todavía pruebas contra una base de datos real (ver roadmap).

## 5.7 Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El proceso termina al arrancar con "Invalid environment variables" | Falta una variable obligatoria | Revisa la tabla de 5.1 |
| `/ready` devuelve 503 | Postgres o Redis caídos o inalcanzables | Mira los logs (`requestId`) y la conectividad; `/health` seguirá en 200 |
| Una ruta admin responde 404 "Module X not found" | Falta el módulo en `modules` | Añade una migración con el módulo y sus permisos |
| Admin recibe 403 en un endpoint | Ningún rol del usuario tiene el permiso del método en ese módulo | Revisa `role_permissions`; recuerda que los roles van en el JWT (reloguear) |
| Los correos no llegan | El worker no corre, `REDIS_URL` mal puesto o SMTP rechaza | Revisa logs `Mail job … failed`; los trabajos fallidos se reintentan 5 veces |
| El webhook devuelve 400 | Firma inválida: `STRIPE_WEBHOOK_SECRET` incorrecto o cuerpo alterado por un proxy | Verifica el secreto del endpoint en Stripe; el cuerpo debe llegar crudo |
| Aparece el log "succeeded but order … is not pending" | Un pago llegó después de que la reserva caducara | Reembolsa el pago en Stripe o revisa el pedido a mano (es una situación rara: la caducidad cancela antes el PaymentIntent) |
| El webhook devuelve 500 | Falló la transacción; Stripe reintentará | Busca el `event.id` en los logs |
| `pnpm install` falla con `ERR_PNPM_IGNORED_BUILDS` | Dependencia nueva con script de build | Decide en `pnpm-workspace.yaml` (`allowBuilds`) |
| 429 en login | Rate limit de autenticación | Espera 15 minutos; con varias réplicas necesitas Redis para un límite coherente |
