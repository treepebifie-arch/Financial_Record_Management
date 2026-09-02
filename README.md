# Financial Record Management API

A RESTful backend API for managing financial records, user wallets, and transaction data.

Built with **Node.js, Express.js, and MongoDB**, the system implements authentication, role-based access control, financial transaction processing, and database-level aggregation for administrative reporting.

## Key Features

* **User & Wallet Management** — Automatic wallet creation for users.
* **Transaction Management** — Handles income and expense records with balance updates and validation.
* **Financial Aggregation** — MongoDB aggregation pipelines for revenue and expense reporting.
* **Role-Based Access Control** — Separate permissions for Admin, Auditor, and User roles.
* **Transaction Tracking** — Unique transaction references and status tracking.
* **Financial Precision** — MongoDB `Decimal128` for monetary values.
* **Input Validation** — Request validation using Zod.
* **Centralized Error Handling** — Consistent API error responses.

## Tech Stack

| Technology | Purpose            |
| ---------- | ------------------ |
| Node.js    | Runtime            |
| Express.js | REST API framework |
| MongoDB    | Database           |
| Mongoose   | ODM                |
| JWT        | Authentication     |
| Zod        | Request validation |
| bcrypt     | Password hashing   |

## Architecture

The application follows a **layered MVC-style architecture** with dedicated service and middleware layers.

```text
src/
├── controllers/    # HTTP request handlers
├── models/         # Database schemas
├── middlewares/    # Authentication, authorization, errors
├── routes/         # API endpoints
├── services/       # Business logic and aggregations
├── utils/          # Reusable utilities
└── config/         # Database and environment configuration
```

The separation keeps HTTP handling, business logic, persistence, and cross-cutting concerns independent.

## Financial Transaction Flow

```text
Request
   ↓
Authentication / Authorization
   ↓
Validation
   ↓
Controller
   ↓
Transaction Service
   ↓
Wallet / Record Update
   ↓
MongoDB
   ↓
API Response
```

Transactions maintain a unique reference (`txRf`) and a lifecycle status such as:

```text
pending → successful
             ↘ failed
             ↘ flagged
```

## Security

* JWT-protected private routes
* Role-based authorization
* Ownership checks for user records
* Password hashing with bcrypt
* Zod request validation
* Centralized error handling

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/treepebifie-arch/Financial_Record_Management.git
cd Financial_Record_Management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file containing the required application and database configuration.

### 4. Start the server

```bash
npm run dev
```

## API Documentation

API requests can be explored through the project's Postman documentation.

## Live API

**Base URL:**
https://api-zorvyn-fintech.onrender.com

## Project Focus

This project demonstrates backend development concepts including:

* RESTful API design
* Authentication and authorization
* Financial data handling
* Database aggregation
* Transaction processing
* Data validation
* Separation of concerns
* Secure API design
