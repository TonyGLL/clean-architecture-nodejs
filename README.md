# Clean Architecture Node.js API

## Description

This project is a RESTful API built with Node.js, Express.js, and TypeScript, following Clean Architecture principles. It provides a robust foundation for building scalable and maintainable backend services with a primary focus on user authentication and management. The architecture emphasizes separation of concerns, making the codebase modular, testable, and easy to evolve.

## Features

*   **User Registration and Login:** Allows new users to create an account and authenticates existing users, providing JWT-based session tokens.
*   **Secure Password Management:** Uses `bcryptjs` to hash passwords and enables users to reset their password via email with a secure token.
*   **Role-Based Access Control (RBAC):** Secures API endpoints using JSON Web Tokens and role-based permissions.
*   **User and Role Management:** Provides CRUD operations for managing users and roles.
*   **Health Check:** A dedicated endpoint (`/health`) to monitor API status.

## Technologies Used

*   **Core:**
    *   Node.js
    *   Express.js
    *   TypeScript
*   **Database:**
    *   PostgreSQL
*   **Architecture & Design:**
    *   Clean Architecture
    *   Dependency Injection (InversifyJS)
*   **Authentication & Authorization:**
    *   JSON Web Tokens (JWT)
    *   `bcryptjs` (Password Hashing)
*   **Validation:**
    *   `express-validator`
*   **Email:**
    *   Nodemailer
*   **Development & Tooling:**
    *   Docker & Docker Compose
    *   Nodemon (for live reloading during development)
    *   `ts-node`
*   **Security & Logging:**
    *   Helmet (Security Headers)
    *   Morgan (HTTP Request Logging)
    *   CORS

## Project Structure

The project adheres to Clean Architecture principles, dividing the codebase into distinct layers:

*   **Domain:** Contains the core business logic, entities, and domain-specific interfaces. This layer is independent of any framework or infrastructure concerns.
    *   `src/domain/entities/`: Business objects (e.g., `User`, `Role`).
    *   `src/domain/repositories/`: Interfaces for data access.
    *   `src/domain/services/`: Domain-specific services.
*   **Application:** Orchestrates the use cases of the application. It depends on the Domain layer but not on the Infrastructure layer.
    *   `src/application/use-cases/`: Application-specific business rules (e.g., `AuthUseCase`, `UserUseCase`, `RoleUseCase`).
    *   `src/application/services/`: Application-level services (e.g., `JwtService`).
    *   `src/application/dtos/`: Data Transfer Objects used by use cases.
*   **Infrastructure:** Implements the interfaces defined in the Application and Domain layers. This layer includes frameworks, databases, external service integrations, and UI components.
    *   `src/infraestructure/config/`: Environment configuration.
    *   `src/infraestructure/database/`: PostgreSQL connection and repository implementations.
    *   `src/infraestructure/driven/services/`: Implementations of external services (e.g., `MailService`).
    *   `src/infraestructure/http/`: Express.js related code (controllers, routes, middlewares, and validators).
    *   `src/infraestructure/ioc/`: InversifyJS dependency injection container setup.
*   **Main:** The entry point of the application (`src/main/server.ts`), responsible for initializing and starting the server and setting up the Express application (`src/main/app.ts`).

## Prerequisites

Before you begin, ensure you have the following installed:

*   Node.js (v18.x or later recommended)
*   npm (or yarn)
*   Docker (optional, for running with Docker Compose)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url> # Replace <repository-url> with the actual URL
cd clean-architecture-nodejs
```

### 2. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 3. Set Up Environment Variables

This project requires environment variables for configuration. If you are **not** using Docker Compose for the database, you'll need to set up a PostgreSQL instance and configure variables for it.

Create a `.env` file in the root of the project. For local development, especially if using Docker Compose, the `docker-compose.yml` references a `dev.env` file for the application service. You can use this file.

**Example `.env` / `dev.env` content:**
```env
PORT=3000

# JWT
JWT_SECRET=your_very_secret_jwt_key_here

# PostgreSQL Database
# These are used if running the Node app directly and managing your own DB instance.
# If using docker-compose.yml, the DB connection string is often set directly there for the app service (see DB_SOURCE in docker-compose.yml).
PSQL_HOST=localhost
PSQL_PORT=5432
PSQL_USER=your_db_user
PSQL_PASSWORD=your_db_password
PSQL_DB=your_db_name

# Email Configuration (e.g., using Mailtrap.io or a real SMTP server)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port # e.g., 2525 for Mailtrap
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com
```

**Note on Docker Compose Database:**
If you use the provided `docker-compose.yml`:
*   A PostgreSQL service is defined with user `root`, password `secret`, and database `ca_nodejs`.
*   The `app_dev` service in `docker-compose.yml` is configured to connect to this database via the `DB_SOURCE` environment variable.
*   You will primarily need to ensure `JWT_SECRET` and email-related variables are set in your `.env` or `dev.env` file.

### 4. Initialize Database Schema (Using Sqitch)

This project uses [Sqitch](https://sqitch.org/) for database change management. Sqitch allows for reliable and repeatable deployments of database schemas. The migration scripts are located in the `deploy/`, `revert/`, and `verify/` directories at the root of the project.

**Key Sqitch files:**
*   `sqitch.plan`: Lists all the database changes in the order they should be applied.
*   `sqitch.conf`: Project-specific Sqitch configuration.
*   `deploy/`: Contains SQL scripts for deploying changes.
*   `revert/`: Contains SQL scripts for reverting changes.
*   `verify/`: Contains SQL scripts for verifying changes.

To deploy the latest database schema:

*   **If using Docker Compose (Recommended):**
    The `app_dev` service in `docker-compose.yml` can be configured to run migrations or you can execute Sqitch commands directly within the running `app_dev` container.
    1.  Ensure the database container is running: `docker-compose up -d db`
    2.  Deploy migrations by running the `sqitch deploy` command inside the `app_dev` container. You might need to configure the database target in `sqitch.conf` or via environment variables (e.g., `SQITCH_TARGET=db:pg://root:secret@db:5432/ca_nodejs`).
        ```bash
        docker-compose exec app_dev sqitch deploy
        # Or, if you have a specific target configured e.g. 'dev_db'
        # docker-compose exec app_dev sqitch deploy dev_db
        ```
    You can check the status of migrations:
        ```bash
        docker-compose exec app_dev sqitch status
        ```

*   **If running PostgreSQL manually (and Sqitch locally):**
    1.  Ensure Sqitch is installed locally (see [Sqitch Download](https://sqitch.org/download/)).
    2.  Configure your database target in `sqitch.conf` or by setting the `SQITCH_TARGET` environment variable (e.g., `export SQITCH_TARGET=db:pg://your_db_user:your_db_password@localhost:5432/your_db_name`).
    3.  Navigate to the project root and run:
        ```bash
        sqitch deploy
        ```

**Common Sqitch Commands:**
*   `sqitch status [target]`: Shows the current deployment status.
*   `sqitch deploy [target]`: Deploys pending changes.
*   `sqitch revert [target]`: Reverts the last deployed change. To revert to a specific change: `sqitch revert [target] --to <change_name_or_tag>`.
*   `sqitch verify [target]`: Verifies deployed changes.
*   `sqitch log [target]`: Shows the history of deployed changes.

**Adding New Migrations (e.g., for Stored Procedures):**
When you need to add new database changes, such as creating stored procedures:
1.  Add a new change to the plan:
    ```bash
    sqitch add my_new_stored_proc -n "Adds my_new_stored_proc."
    # For changes that depend on others:
    # sqitch add new_feature --requires existing_table -n "Adds new feature depending on existing_table."
    ```
2.  Edit the generated `deploy/my_new_stored_proc.sql` file with your SQL `CREATE PROCEDURE...` statement.
3.  Edit `revert/my_new_stored_proc.sql` with `DROP PROCEDURE...`.
4.  Edit `verify/my_new_stored_proc.sql` to check if the procedure was created (e.g., by querying `information_schema.routines`).
5.  Commit the changes to `sqitch.plan` and the script files.
6.  Run `sqitch deploy` to apply the new migration.

### 5. Run the Development Server (without Docker)

```bash
npm run dev
```
The server will start, typically on `http://localhost:3000` (or the `PORT` specified in your `.env` file).

### 6. Running with Docker Compose (Recommended for Development)

The project includes `Dockerfile` and `docker-compose.yml` for a containerized setup.

1.  Ensure Docker is running.
2.  Ensure you have a `.env` or `dev.env` file as configured in `docker-compose.yml` (for `JWT_SECRET`, email settings, etc.). The database connection is handled by `DB_SOURCE` in `docker-compose.yml`.
3.  Build and start the services:
    ```bash
    docker-compose up --build -d # -d runs in detached mode
    ```
    This will start the Node.js application (`app_dev` service) and a PostgreSQL database (`db` service) pre-configured to work together. The application will be available on `http://localhost:3000`.
4.  Apply database migrations using Sqitch as described in step 4 ("Initialize Database Schema (Using Sqitch)"). Typically, you would run `docker-compose exec app_dev sqitch deploy`.
5.  To see logs: `docker-compose logs -f app_dev db`
6.  To stop: `docker-compose down`

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication (Client)

*   `POST /client/auth/register`: Register a new user.
    *   **Body:** `{ "name": "John", "lastName": "Doe", "email": "john.doe@example.com", "password": "securePassword123", "birth_date": "YYYY-MM-DD", "phone": "1234567890" }`
*   `POST /client/auth/login`: Log in an existing user.
    *   **Body:** `{ "email": "john.doe@example.com", "password": "securePassword123" }`
*   `POST /client/auth/send-email`: Request a password reset email.
    *   **Body:** `{ "email": "john.doe@example.com" }`
*   `POST /client/auth/restore-password`: Restore password using a token from the reset email.
    *   **Body:** `{ "email": "john.doe@example.com", "token": "your_reset_token", "password": "newSecurePassword456" }`

### Admin

The following endpoints require authentication.

#### User Management

*   `GET /admin/users`: Get a list of users.
*   `GET /admin/users/:id`: Get user details.
*   `POST /admin/users`: Create a new user.
*   `PUT /admin/users/:id`: Update a user.
*   `DELETE /admin/users/:id`: Delete a user.
*   `PATCH /admin/users/:id/password`: Change a user's password.
*   `POST /admin/users/:id/roles`: Assign a role to a user.

#### Role Management

*   `GET /admin/roles`: Get a list of roles.
*   `GET /admin/roles/:id`: Get permissions for a role.
*   `POST /admin/roles`: Create a new role.
*   `PUT /admin/roles/:id`: Update a role.
*   `DELETE /admin/roles/:id`: Delete a role.

### Health Check

*   `GET /health`: Check the health status of the API.
    *   **Response:** `{ "ok": true }`

## Running Tests

This project uses `jest` for testing. To run the tests, use the following command:

```bash
npm test
```

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the ISC License (as per `package.json`).
