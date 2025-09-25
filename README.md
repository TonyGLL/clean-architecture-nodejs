# Clean Architecture Node.js E-Commerce API

## 1. Overview

This project is a comprehensive e-commerce platform built with Node.js, Express.js, and TypeScript, adhering to the principles of **Clean Architecture**. It provides a robust and secure backend API for managing a full-featured online store, from user authentication and product catalogs to a shopping cart and payment processing with Stripe.

The architecture is designed to be modular, scalable, and maintainable, with a strong emphasis on security and a clear separation of concerns. The system is fully containerized using Docker, making setup and deployment straightforward.

## 2. Core Features

*   **Dual Authentication System:** Secure, separate authentication flows for both customers and administrators using JSON Web Tokens (JWT).
*   **Role-Based Access Control (RBAC):** Granular permission system for the admin panel, ensuring administrators can only access authorized resources.
*   **Comprehensive Admin Panel:** A complete set of API endpoints for managing users, roles, permissions, and products.
*   **Full E-commerce Functionality:**
    *   Product Catalog Management
    *   Persistent Shopping Cart
    *   Wishlist Management
    *   Customer Address Books
    *   Product Reviews and Ratings
*   **Stripe Payment Integration:** A complete payment lifecycle, including saving payment methods, processing payments, and handling webhooks for order confirmation.
*   **Automated Product Sync:** A daily cron job keeps the product catalog updated by fetching data from an external API.
*   **Server-Side Views:** Includes EJS templates for client-facing pages like checkout and payment forms.

## 3. Architecture and Technology Stack

This project follows the **Clean Architecture** model, which ensures a clear separation between business logic and technical implementation details. The codebase is organized into three primary layers:

*   **Domain:** Contains the core business logic, entities (e.g., `User`, `Product`), and interfaces for repositories and services. This layer is completely independent of any frameworks or infrastructure.
*   **Application:** Orchestrates the use cases of the application (e.g., `RegisterUser`, `CreateOrder`). It depends on the Domain layer but not on the Infrastructure layer.
*   **Infrastructure:** Implements the interfaces defined in the other layers. This includes controllers, database access, external service integrations (like Stripe and Nodemailer), and the web server.

### System Architecture

The application runs as a set of containerized services orchestrated by Docker Compose:

1.  **Nginx (`nginx`):** Acts as a **reverse proxy**. It is the public-facing entry point for all traffic. Its responsibilities include:
    *   Terminating SSL (in a production environment).
    *   Serving static assets (CSS, JS, images) directly for better performance.
    *   Applying security headers (HSTS, X-Frame-Options).
    *   Forwarding API requests to the Node.js application server.
2.  **Application Server (`app_dev`):** The core Node.js application built with Express.js. It handles all business logic, API requests, and communication with the database.
3.  **Database (`db`):** A PostgreSQL instance for data persistence. It is only accessible from within the Docker network, not from the public internet.

### Technology Stack

*   **Backend:** Node.js, Express.js, TypeScript
*   **Database:** PostgreSQL
*   **Architecture:** Clean Architecture, Dependency Injection (InversifyJS)
*   **Authentication:** JSON Web Tokens (JWT), `bcryptjs`
*   **Payments:** Stripe
*   **Containerization:** Docker, Docker Compose
*   **Web Server:** Nginx (as a reverse proxy)
*   **Key Libraries:**
    *   `helmet`: For securing HTTP headers.
    *   `cors`: For managing Cross-Origin Resource Sharing.
    *   `express-validator`: For validating incoming request data.
    *   `winston`: For application logging.
    *   `morgan`: For HTTP request logging.
    *   `cron`: For scheduling automated tasks.

## 4. Security Considerations

Security is a primary focus of this application. The following measures have been implemented:

*   **Authentication & Authorization:**
    *   **JWT:** The API uses JWTs for stateless authentication. Separate secrets are used for customer and admin tokens, ensuring a breach in one system does not compromise the other.
    *   **RBAC:** The admin panel is protected by a role-based access control system, where permissions are assigned to roles, and roles are assigned to users.
*   **Password Security:** Passwords are never stored in plaintext. They are hashed using the `bcryptjs` library with a salt.
*   **API & HTTP Security:**
    *   **Helmet:** The `helmet` library is used to set important security headers, protecting against common vulnerabilities like cross-site scripting (XSS) and clickjacking.
    *   **CORS:** Cross-Origin Resource Sharing is configured to restrict which domains can access the API, preventing unauthorized cross-site requests.
    *   **Input Validation:** All incoming data from clients is validated using `express-validator` to prevent malformed data and injection attacks.
*   **Infrastructure Security:**
    *   **Reverse Proxy:** Nginx acts as a reverse proxy, hiding the application server from the public internet and reducing its attack surface.
    *   **Environment Variables:** All sensitive information (database credentials, API keys, JWT secrets) is managed through environment variables and is never hard-coded into the source code.
*   **Logging and Monitoring:**
    *   **Winston:** Provides structured, leveled logging, which is crucial for monitoring application health and investigating security incidents.
    *   **Morgan:** Logs all incoming HTTP requests, providing an audit trail of API activity.

## 5. Prerequisites

Before you begin, ensure you have the following installed:

*   **Docker and Docker Compose:** For running the containerized application stack.
*   **Node.js and npm:** (Optional, for local development outside of Docker).
*   **Git:** For cloning the repository.

## 6. Getting Started

The recommended way to run this project is with Docker.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Configure Environment Variables
Create a `.env` file in the project root by copying the example. This file is critical for configuring the database, JWT secrets, and external services.

```bash
cp .env.example .env
```
Now, open the `.env` file and fill in the required values, especially for the Stripe and email services.

### 3. Run the Application with Docker Compose
This single command builds the Docker images, starts the application, database, and Nginx proxy, and connects them.

```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost:80`.

### 4. Initialize the Database
With the containers running, execute the database initialization script. This only needs to be done once to set up the tables and initial data.

```bash
./scripts/init-db.sh
```
> **Note for Windows Users:** You can run this script using Git Bash or WSL (Windows Subsystem for Linux).

## 7. Environment Configuration

The `.env` file holds all configuration variables. Key variables include:

| Variable              | Description                                        |
| --------------------- | -------------------------------------------------- |
| `PORT`                | The port on which the Node.js app will run.        |
| `JWT_SECRET_CLIENT`   | Secret key for signing customer JWTs.              |
| `JWT_SECRET_ADMIN`    | Secret key for signing administrator JWTs.         |
| `PSQL_HOST`           | Hostname of the PostgreSQL database.               |
| `PSQL_PORT`           | Port for the PostgreSQL database.                  |
| `PSQL_USER`           | Username for the database.                         |
| `PSQL_PASSWORD`       | Password for the database.                         |
| `PSQL_DB`             | Name of the database.                              |
| `SMTP_HOST`           | Host for the email sending service (SMTP).         |
| `SMTP_PORT`           | Port for the SMTP service.                         |
| `SMTP_USER`           | Username for the SMTP service.                     |
| `SMTP_PASS`           | Password for the SMTP service.                     |
| `EMAIL_FROM`          | The "from" address for outgoing emails.            |
| `STRIPE_PUBLIC_KEY`   | Your Stripe public key.                            |
| `STRIPE_SECRET_KEY`   | Your Stripe secret key.                            |
| `STRIPE_WEBHOOK_SECRET`| Your Stripe webhook signing secret.                |

## 8. API Endpoints

All API endpoints are prefixed with `/api/v1`. For a detailed list of all endpoints, please refer to the existing `README.md` or the source code in `src/infrastructure/http/routes`.

## 9. Running Tests

To run the automated tests, execute the following command:

```bash
npm test
```

## 10. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push your changes to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

## 11. License

This project is licensed under the ISC License.