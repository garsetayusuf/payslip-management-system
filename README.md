# Payroll Management System

A scalable payroll management system built with NestJS, Prisma, and PostgreSQL that handles employee attendance, overtime tracking, reimbursements, and automated payslip generation.

## Features

- **Employee Management**: Manage 100+ employees with individual salary configurations
- **Attendance Tracking**: Flexible attendance submission with prorated salary calculations
- **Overtime Management**: Track and approve overtime with 2x salary multiplier
- **Reimbursement System**: Handle employee expense reimbursements
- **Automated Payroll**: Process payroll for specific periods with one-click generation
- **Payslip Generation**: Detailed payslip breakdown for employees and admin summaries
- **Audit Trail**: Complete traceability with timestamps, user tracking, and IP logging
- **Role-based Access**: Separate admin and employee functionalities

## Architecture

### Tech Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit and integration tests
- **Server**: Fastify

## Documentation

1. System Design : using mermaid.js to create a system design diagram for this project and how it work, you can find the diagram in this [link](https://www.mermaidchart.com/app/projects/2bab3068-5bac-4a35-baae-4af2f7fbe6a4/diagrams/b27a0009-f0c0-4890-ae2f-b494b3a2493a/share/invite/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N1bWVudElEIjoiYjI3YTAwMDktZjBjMC00ODkwLWFlMmYtYjQ5NGIzYTI0OTNhIiwiYWNjZXNzIjoiVmlldyIsImlhdCI6MTc0OTYyOTIzNH0.adjNcfFDJ2IothPmVRRmwciQJXu3RyHx3R3ZRlwFvK8)
2. Database Design : using dbdiagram to create database schema for this project, you can find the diagram in this [link](https://dbdiagram.io/d/Payslip-management-system-673c0d93e9daa85acae8d244)

### Project Structure

```
src/
├── common/
│   ├── config/           # Environment and Swagger configuration
│   ├── decorators/       # Custom decorators (roles, response, etc.)
│   ├── guards/           # Authentication and authorization guards
│   ├── interceptors/     # Request/response interceptors
│   ├── interfaces/       # TypeScript interfaces
│   ├── middleware/       # HTTP logging middleware
│   ├── modules/          # Core business modules
│   └── shared/           # Shared services (Prisma)
├── helpers/              # Utility functions and examples
└── main.ts              # Application entry point
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- pnpm

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/garsetayusuf/payslip-management-system
   cd payroll-management-system
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

  ```env
  # Database Configuration
  # Use the following DATABASE_URL when PostgreSQL is already installed on the host
  DATABASE_URL=postgresql://postgres:postgres@db:5432/payslip?schema=public

  # Docker-based PostgreSQL configuration (example for docker-compose)
  POSTGRES_HOST=postgres
  POSTGRES_PORT=5433
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=postgres
  POSTGRES_DB=payslip

  # Server Configuration
  NODE_ENV=development
  PORT=5000
  CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173

  # JWT Configuration
  JWT_SECRET=<your-jwt-secret>
  JWT_EXPIRES=30d
   ```

- Note
  - If PostgreSQL is already running on your host machine, you must use:

    ```env
    DATABASE_URL=postgresql://postgres:postgres@db:5432/payslip?schema=public
    POSTGRES_HOST=postgres
    POSTGRES_PORT=5433
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=payslip
      ```  

  - The port `5433` is used to avoid conflict with default PostgreSQL port `5432`.
  - If you are running PostgreSQL in a Docker container, ensure that the service name is `db` and the container port is `5432`
  - Modify `docker-compose.yml` accordingly if you're using Docker for your development environment.

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   
   # Seed the database with fake data
   npx prisma db seed
   ```

5. **Start the application**

   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

## Authentication

The system uses cookie-based session authentication instead of bearer tokens. After login, the server sets an HTTP-only cookie that stores the session or access token.

### Default Admin Account

- **Username**: `admin`
- **Password**: `admin123`

### Employee Accounts

100 employees are auto-generated with usernames `employee1` to `employee100` and password `password123`.

- Note:
  - Cookies are configured to be HTTP-only and secure in production.
  - The cookie is set with `withCredentials: true` on the frontend.

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:5000/swagger
```

### Core Endpoints

#### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/change-password` - Change password

#### Admin Endpoints

- `POST /attendance-period` - Create attendance period
- `GET /attendance-period` - Get attendance periods
- `POST /payroll/process` - Process payroll for a period
- `GET /payroll/summary` - Get payroll summary for all employees

#### Employee Endpoints

- `POST /attendance` - Submit daily attendance
- `GET /attendance` - Get personal attendance records
- `POST /overtime` - Submit overtime request
- `GET /overtime` - Get personal overtime records
- `POST /reimbursement` - Submit reimbursement request
- `GET /reimbursement` - Get personal reimbursement records
- `GET /payslip` - Generate personal payslip

## Business Rules

### Attendance

- Regular working hours: 9 AM - 5 PM (8 hours/day)
- Working days: Monday - Friday
- Check-in anytime during the day counts as attendance
- One submission per day maximum
- Weekend submissions are not allowed
- Salary is prorated based on attendance percentage

### Overtime

- Must be submitted after regular working hours
- Maximum 3 hours per day
- Can be taken any day of the week
- Paid at 2x the prorated hourly rate
- Requires approval workflow

### Reimbursements

- Employees can submit expense reimbursements
- Must include amount and description
- Included in payslip after approval

### Payroll Processing

- Admin processes payroll for specific attendance periods
- Once processed, records from that period are locked
- Each period can only be processed once
- Generates payslips for all employees

## Database Schema

The system uses the following main entities:

- **User**: Authentication and basic user info
- **Employee**: Employee details and salary information
- **AttendancePeriod**: Payroll periods defined by admin
- **Attendance**: Daily attendance records
- **Overtime**: Overtime requests and approvals
- **Reimbursement**: Expense reimbursement requests
- **Payroll**: Processed payroll records
- **Payslip**: Generated payslip details
- **AuditLog**: System audit trail

## Testing

Run the test suites:

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Audit & Traceability

The system implements comprehensive audit logging:

- **Timestamps**: All records include `created_at` and `updated_at`
- **User Tracking**: Track `created_by` and `updated_by` for all operations
- **IP Logging**: Store client IP addresses for requests
- **Audit Trail**: Maintain detailed audit logs for significant changes
- **Request Tracing**: Include `request_id` for cross-service tracing

## Performance & Scalability

### Optimization Features

- Database indexing on frequently queried fields
- Pagination support for large datasets
- Efficient query patterns with Prisma
- Request/response caching strategies
- Performance monitoring interceptors

### Scaling Considerations

- Database connection pooling
- Horizontal scaling support
- Caching layer integration ready
- Microservice architecture compatible

## Development

### Available Scripts

```bash
npm run build          # Build the application
npm run start         # Start production server
npm run start:dev     # Start development server
npm run start:debug   # Start with debugging
npm run lint          # Run ESLint
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Run tests with coverage
```

### Code Quality

- ESLint configuration for code consistency
- Prettier for code formatting
- TypeScript for type safety

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL`in `.env` file
   - Ensure database exists and user has permissions

2. **Cookie Not Set / Missing**
   - Confirm `withCredentials: true` on frontend
   - In production, make sure HTTPS is used with `secure: true`

3. **Migration Errors**
   - Reset database: `npx prisma migrate reset`
   - Generate client: `npx prisma generate`
   - Run migrations: `npx prisma migrate deploy`
