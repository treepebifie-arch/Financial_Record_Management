## Financial_Record_Management

This is a robust Backend RESTful API built with Node.js, Express, and MongoDB. It is designed to manage financial transactions (Income/Expense), track user balances via a dedicated Wallet system, and provide an administrative dashboard with advanced data aggregation. The system includes Role-Based Access Control (RBAC).

## Key Features

User & Wallet Management: Automatic wallet creation upon user registration.

Transaction Engine: Handles income and expense records with automatic balance updates and validation.

Administrative Dashboard: High-performance data aggregation using MongoDB pipelines to calculate total revenue and expenses

Role-Based Security: Custom middleware for Admin, Auditor, and User roles to ensure data privacy.

Audit Trail: Every transaction is indexed with a unique reference (txRf) and status tracking (pending, successful, failed, flagged).

Data Integrity: Implements Decimal128 for financial precision.

## Tech Stack

Runtime: Node.js
Framework: Express.js
Database: MongoDB with Mongoose ODM
Authentication: JWT (JSON Web Tokens) 
Validation: Zod
 
 
## Project Structure

This project follows MVC architecture, for easier debugging and maintainability.

```
├── src/
│   ├── controllers/    # Route handlers
│   ├── models/         # Mongoose schemas (User, Wallet, Record)
│   ├── middlewares/    # Auth, Role validation, Error handling, Api Response, 
│   ├── routes/         # API endpoint definitions
│   ├── services/       # Business logic & Aggregation pipelines
│   ├── utils/          # Helpers (Jwt token and bcrypt hash setup)
│   └── config/         # DB and Environment configurations
├── .env                # Environment variables
├── seed.js             # Seed script for populating database
├── app.js              # App setup and initializations
└── server.js           # Entry point

```
## Getting Started

Clone the repository: Bashgit clone https://github.com/your-username/financial-record-mgmt.git

Install dependencies: Bashnpm install

Set up your .env file

Run the development server:Bashnpm run dev


## Security Implementations

JWT Protection: All private routes require a Bearer Token.

Ownership Check: Standard users can only view or search for their own records.

Error Handling: Centralized error-handling middleware for consistent API responses. 