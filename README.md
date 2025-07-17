# Clean Architecture Node.js API

## Descripción

Este proyecto es una API RESTful construida con Node.js, Express.js y TypeScript, siguiendo los principios de Clean Architecture. Proporciona una base sólida para construir servicios de backend escalables y mantenibles, con un enfoque principal en la autenticación y gestión de usuarios, catálogo de productos, carrito de compras y procesamiento de pagos. La arquitectura enfatiza la separación de preocupaciones, lo que hace que el código base sea modular, comprobable y fácil de evolucionar.

## Features

*   **Sistema de Autenticación Dual:**
    *   **Autenticación de Cliente:** Permite a los nuevos clientes (compradores) registrarse, iniciar sesión y gestionar sus cuentas (por ejemplo, restablecer la contraseña por correo electrónico).
    *   **Autenticación de Administrador:** Autenticación separada para usuarios administradores con tokens de sesión basados en JWT.
*   **Gestión Segura de Contraseñas:** Utiliza `bcryptjs` para hashear las contraseñas tanto de los clientes como de los usuarios administradores.
*   **Control de Acceso Basado en Roles (RBAC) para el Panel de Administración:** Asegura los endpoints de la API de administración mediante JSON Web Tokens y permisos basados en roles.
*   **Gestión de Usuarios y Roles de Administrador:** Proporciona operaciones CRUD para gestionar usuarios administradores y sus roles/permisos.
*   **Gestión de Módulos (Admin):** Permite a los administradores realizar operaciones CRUD en los módulos del sistema, que se utilizan para definir permisos.
*   **Gestión del Catálogo de Productos:**
    *   Los administradores pueden insertar o actualizar productos y sus categorías a través de un procedimiento almacenado.
    *   Los clientes pueden buscar productos, ver detalles de productos y listar productos por categoría.
*   **Funcionalidad del Carrito de Compras (Cliente):**
    *   Los clientes pueden agregar productos a su carrito.
    *   Ver los detalles del carrito.
    *   Eliminar productos del carrito.
    *   Vaciar todo el carrito.
*   **Integración de Pagos con Stripe:**
    *   Gestión de métodos de pago del cliente.
    *   Creación de intentos de pago (Payment Intents) para procesar transacciones.
    *   Manejo de webhooks de Stripe para actualizar el estado de los pagos y pedidos.
*   **Gestión de Pedidos:**
    *   Creación de pedidos después de un pago exitoso.
    *   Consulta del historial de pedidos para los clientes.
    *   Actualización del estado de los pedidos (por ejemplo, pendiente, enviado, entregado).
*   **Health Check:** Un endpoint dedicado (`/health`) para monitorear el estado de la API.

## Tecnologías Utilizadas

*   **Core:**
    *   Node.js
    *   Express.js
    *   TypeScript
*   **Base de Datos:**
    *   PostgreSQL
*   **Arquitectura y Diseño:**
    *   Clean Architecture
    *   Inyección de Dependencias (InversifyJS)
*   **Autenticación y Autorización:**
    *   JSON Web Tokens (JWT)
    *   `bcryptjs` (Hashing de Contraseñas)
*   **Pagos:**
    *   Stripe
*   **Validación:**
    *   `express-validator`
*   **Correo Electrónico:**
    *   Nodemailer
*   **Desarrollo y Herramientas:**
    *   Docker y Docker Compose
    *   Nodemon (para recarga en vivo durante el desarrollo)
    *   `ts-node`
*   **Seguridad y Logging:**
    *   Helmet (Cabeceras de Seguridad)
    *   Morgan (Logging de Peticiones HTTP)
    *   CORS

## Estructura del Proyecto

El proyecto se adhiere a los principios de Clean Architecture, dividiendo el código base en capas distintas:

*   **Domain:** Contiene la lógica de negocio principal, las entidades y las interfaces específicas del dominio. Esta capa es independiente de cualquier framework o preocupación de infraestructura.
    *   `src/domain/entities/`: Objetos de negocio (ej. `User`, `Role`, `Client`, `Product`, `Cart`, `Module`, `Order`, `Payment`).
    *   `src/domain/repositories/`: Interfaces para el acceso a datos (ej. `IUserRepository`, `IRoleRepository`, `IProductsRepository`, `ICartRepository`, `IOrderRepository`, `IStripePaymentRepository`).
    *   `src/domain/services/`: Servicios específicos del dominio (ej. `HashingService`, `MailService`, `StripeService`).
*   **Application:** Orquesta los casos de uso de la aplicación. Depende de la capa de Dominio pero no de la capa de Infraestructura.
    *   `src/application/use-cases/`: Reglas de negocio específicas de la aplicación (ej. `AuthUseCase`, `ProductsUseCase`, `CartUseCase`, `OrderUseCase`, `StripeUseCase`).
    *   `src/application/services/`: Servicios a nivel de aplicación (ej. `JwtService`).
    *   `src/application/dtos/`: Data Transfer Objects (DTOs) utilizados por los casos de uso para entrada y salida.
*   **Infrastructure:** Implementa las interfaces definidas en las capas de Aplicación y Dominio. Esta capa incluye frameworks, bases de datos, integraciones de servicios externos y componentes de UI.
    *   `src/infraestructure/config/`: Configuración del entorno (`env.ts`).
    *   `src/infraestructure/database/`: Conexión a PostgreSQL, implementaciones de repositorios.
    *   `src/infraestructure/driven/services/`: Implementaciones de servicios externos (ej. `NodemailerMailService`, `StripeServiceImpl`).
    *   `src/infraestructure/http/`: Código relacionado con Express.js:
        *   `controllers/`: Manejan las peticiones HTTP y orquestan las respuestas.
        *   `routes/`: Definen los endpoints de la API.
        *   `middlewares/`: Middleware personalizado para tareas como autenticación y validación.
        *   `validators/`: Reglas de validación de peticiones con `express-validator`.
    *   `src/infraestructure/ioc/`: Configuración del contenedor de inyección de dependencias de InversifyJS.
*   **Main:** El punto de entrada de la aplicación (`src/main/server.ts`), responsable de inicializar y arrancar el servidor.
*   **Esquema de la Base de Datos (`src/db/`)**:
    *   `schema.sql`: Contiene las sentencias DDL para crear tablas y definir relaciones.
    *   `inserts.sql`: Datos iniciales para tablas (ej. roles, módulos).
    *   `stored-procedures/`: Scripts SQL para crear procedimientos almacenados.

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente:

*   Node.js (v18.x o superior recomendado)
*   npm (o yarn)
*   Docker (opcional, para ejecutar con Docker Compose)

## Getting Started

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto. Puedes usar el archivo `dev.env` como plantilla.

**Ejemplo de contenido para `.env`:**
```env
PORT=3000

# JWT
JWT_SECRET=your_very_secret_jwt_key_here

# PostgreSQL Database (si no usas Docker)
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=your_db_user
PSQL_PASSWORD=your_db_password
PSQL_DB=your_db_name

# Email Configuration (ej. Mailtrap.io)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Nota sobre la Base de Datos con Docker Compose:**
Si usas `docker-compose.yml`, este define un servicio de PostgreSQL con usuario `root`, contraseña `secret`, y base de datos `ca_nodejs`. La aplicación se conecta a esta base de datos a través de la variable de entorno `DB_SOURCE` definida en `docker-compose.yml`.

### 4. Inicializar la Base de Datos

Los scripts para inicializar la base de datos se encuentran en `src/db/`. Deben ejecutarse en el siguiente orden:

1.  `src/db/schema.sql` (crear tablas)
2.  `src/db/inserts.sql` (insertar datos iniciales)
3.  Scripts en `src/db/stored-procedures/` (crear procedimientos almacenados)

**Si usas Docker Compose (Recomendado):**

1.  Asegúrate de que el contenedor de la base de datos esté en ejecución: `docker-compose up -d db`.
2.  Conéctate a la base de datos usando un cliente de PostgreSQL (como `psql` o una herramienta gráfica) con las siguientes credenciales:
    *   **Host:** `localhost`
    *   **Puerto:** `5432`
    *   **Usuario:** `root`
    *   **Contraseña:** `secret`
    *   **Base de datos:** `ca_nodejs`
3.  Ejecuta los scripts SQL en el orden mencionado.

**Si usas PostgreSQL manualmente:**

1.  Asegúrate de que tu servidor de PostgreSQL esté en ejecución.
2.  Usa `psql` u otro cliente para conectarte a tu base de datos.
3.  Ejecuta los scripts SQL en el orden correcto.

### 5. Ejecutar el Servidor de Desarrollo (sin Docker)

```bash
npm run dev
```
El servidor se iniciará en `http://localhost:3000`.

### 6. Ejecutar con Docker Compose

1.  Asegúrate de que Docker esté en ejecución.
2.  Crea tu archivo `.env` como se describe en el paso 3.
3.  Construye e inicia los servicios:
    ```bash
    docker-compose up --build -d
    ```
    Esto iniciará la aplicación Node.js y la base de datos PostgreSQL. La aplicación estará disponible en `http://localhost:3000`.
4.  **Inicializa la base de datos** como se describe en el paso 4.

## API Endpoints

Todos los endpoints de la API tienen el prefijo `/api/v1`.

### Autenticación de Cliente (`/client/auth`)

*   `POST /client/auth/register`: Registrar un nuevo cliente.
*   `POST /client/auth/login`: Iniciar sesión como cliente.
*   `POST /client/auth/send-email`: Solicitar un correo para restablecer la contraseña.
*   `POST /client/auth/restore-password`: Restablecer la contraseña con un token.

### Catálogo de Productos (`/products`)

*   `GET /products/search?q=<query>`: Buscar productos.
*   `GET /products/:id`: Obtener detalles de un producto.
*   `GET /products/categories/:id`: Obtener productos por categoría.

### Carrito de Compras del Cliente (`/client/cart`)

*   `GET /client/cart`: Obtener el carrito del cliente.
*   `POST /client/cart/add/:id`: Añadir un producto al carrito.
*   `DELETE /client/cart/delete/:id`: Eliminar un producto del carrito.
*   `DELETE /client/cart/clear`: Vaciar el carrito.

### Pagos con Stripe (`/client/stripe`)

*   `POST /client/stripe/create-setup-intent`: Crear un intento de configuración para guardar una tarjeta.
*   `POST /client/stripe/payment-methods`: Añadir un método de pago.
*   `GET /client/stripe/payment-methods`: Obtener los métodos de pago del cliente.
*   `DELETE /client/stripe/payment-methods/:paymentMethodId`: Eliminar un método de pago.
*   `POST /client/stripe/create-payment-intent`: Crear un intento de pago para procesar una compra.

### Webhooks de Stripe (`/stripe/webhook`)

*   `POST /stripe/webhook`: Manejar eventos de webhook de Stripe (ej. `payment_intent.succeeded`).

### Panel de Administración (`/admin`)

Todos los endpoints bajo `/admin` requieren autenticación de administrador.

#### Autenticación de Admin (`/admin/auth`)
*   `POST /admin/auth/login`: Iniciar sesión como administrador.

#### Gestión de Usuarios Admin (`/admin/users`)
*   `GET /admin/users`: Obtener lista de usuarios admin.
*   `POST /admin/users`: Crear un nuevo usuario admin.
*   ... (CRUD completo)

#### Gestión de Roles (`/admin/roles`)
*   `GET /admin/roles`: Obtener lista de roles.
*   `POST /admin/roles`: Crear un nuevo rol.
*   ... (CRUD completo)

#### Gestión de Módulos (`/admin/modules`)
*   `GET /admin/modules`: Obtener lista de módulos.
*   `POST /admin/modules`: Crear un nuevo módulo.
*   ... (CRUD completo)

### Health Check (`/health`)

*   `GET /health`: Comprobar el estado de la API.

## Ejecutar Pruebas

```bash
npm test
```

## Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1.  Haz un fork del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/your-feature-name`).
3.  Realiza tus cambios.
4.  Haz commit de tus cambios (`git commit -m 'Add some feature'`).
5.  Empuja a la rama (`git push origin feature/your-feature-name`).
6.  Abre un Pull Request.

## Licencia

Este proyecto está licenciado bajo la Licencia ISC.
