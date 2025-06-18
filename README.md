# Clean Architecture Node.js API

## Description

This project is a RESTful API built with Node.js, Express.js, and TypeScript, following Clean Architecture principles. It provides a robust foundation for building scalable and maintainable backend services with a primary focus on user authentication and management. The architecture emphasizes separation of concerns, making the codebase modular, testable, and easy to evolve.

## Features

*   **User Registration:** Allows new users to create an account.
*   **User Login:** Authenticates existing users and provides JWT-based session tokens.
*   **Secure Password Hashing:** Uses bcryptjs to hash passwords before storing them.
*   **Password Reset:** Enables users to request a password reset via email and set a new password using a secure token.
*   **JWT-based Authentication:** Secures API endpoints using JSON Web Tokens.
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
    *   bcryptjs (Password Hashing)
*   **Email:**
    *   Nodemailer
*   **Development & Tooling:**
    *   Docker & Docker Compose
    *   Nodemon (for live reloading during development)
    *   ts-node
*   **Security & Logging:**
    *   Helmet (Security Headers)
    *   Morgan (HTTP Request Logging)
    *   CORS

## Project Structure

The project adheres to Clean Architecture principles, dividing the codebase into distinct layers:

*   **Domain:** Contains the core business logic, entities, and domain-specific interfaces. This layer is independent of any framework or infrastructure concerns.
    *   `src/domain/entities/`: Business objects (e.g., `User`).
    *   `src/domain/repositories/`: Interfaces for data access.
    *   `src/domain/services/`: Domain-specific services.
*   **Application:** Orchestrates the use cases of the application. It depends on the Domain layer but not on the Infrastructure layer.
    *   `src/application/use-cases/`: Application-specific business rules (e.g., `AuthUseCase`).
    *   `src/application/services/`: Application-level services (e.g., `JwtService`).
    *   `src/application/dtos/`: Data Transfer Objects used by use cases.
*   **Infrastructure:** Implements the interfaces defined in the Application and Domain layers. This layer includes frameworks, databases, external service integrations, and UI components.
    *   `src/infraestructure/config/`: Environment configuration.
    *   `src/infraestructure/database/`: PostgreSQL connection and repository implementations.
    *   `src/infraestructure/driven/services/`: Implementations of external services (e.g., `MailService`).
    *   `src/infraestructure/http/`: Express.js related code (controllers, routes, middlewares).
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

### 4. Initialize Database Schema

The project includes SQL scripts to initialize the database schema:
*   `src/db/schema/init_schema_up.sql`: Creates the necessary tables.
*   `src/db/schema/init_schema_down.sql`: Drops the tables (for cleanup).

You'll need to run `init_schema_up.sql` against your PostgreSQL database before starting the application for the first time.
*   **If using Docker Compose:** Once the `db` service is running (`docker-compose up`), you can execute the script in the PostgreSQL container. You might need a tool like `psql` within the container or connect from your host machine to `localhost:5432` (if port mapping is default) using the credentials `root/secret` and database `ca_nodejs`.
*   **If running PostgreSQL manually:** Use a PostgreSQL client like `psql` or a GUI tool.

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
4.  Remember to apply the database schema as mentioned in step 4.
5.  To see logs: `docker-compose logs -f app_dev db`
6.  To stop: `docker-compose down`

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication

*   `POST /auth/register`: Register a new user.
    *   **Body:** `{ "name": "John", "lastName": "Doe", "email": "john.doe@example.com", "password": "securePassword123", "birth_date": "YYYY-MM-DD", "phone": "1234567890" }`
*   `POST /auth/login`: Log in an existing user.
    *   **Body:** `{ "email": "john.doe@example.com", "password": "securePassword123" }`
*   `POST /auth/send-email`: Request a password reset email.
    *   **Body:** `{ "email": "john.doe@example.com" }`
*   `POST /auth/restore-password`: Restore password using a token from the reset email.
    *   **Body:** `{ "email": "john.doe@example.com", "token": "your_reset_token", "password": "newSecurePassword456" }`

### Health Check

*   `GET /health`: Check the health status of the API.
    *   **Response:** `{ "ok": true }`

## Running Tests

(Information about running tests would go here if test scripts were defined in `package.json` or test files were present in the codebase. Currently, no explicit test setup is visible.)

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
