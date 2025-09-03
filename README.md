# Clinic Appointment Booking System

A comprehensive RESTful API for managing clinic appointments with role-based access control, automatic conflict detection, and professional API documentation.

## 🏗️ Architecture Overview

This system implements a clean, layered architecture:

- **Controllers** (`src/controllers/`) - HTTP request handling and validation
- **Services** (`src/services/`) - Business logic and data operations  
- **Database** (`src/database.ts`) - SQLite database configuration and schema
- **Types** (`src/types.ts`) - TypeScript interfaces and type definitions
- **Documentation** (`docs/`) - OpenAPI 3.0 specification and generated docs

## 🚀 Features

### Core Functionality
- **Appointment Management**: Create, view, and manage clinic appointments
- **Role-Based Access Control**: Patient, Clinician, and Admin role permissions
- **Automatic Entity Creation**: Clinicians and patients created automatically if they don't exist
- **Conflict Detection**: Prevents overlapping appointments for the same clinician
- **Date Range Filtering**: Query appointments within specific time ranges
- **UTC Timezone Consistency**: All timestamps handled in UTC

### API Documentation
- **Interactive Documentation**: Professional Redoc-generated API docs
- **OpenAPI 3.0 Specification**: Comprehensive API documentation in YAML format
- **Auto-Generated**: Static HTML documentation with embedded styling
- **Accessible at**: `https://pgd1998.github.io/lyrebird-coding-challenge/`

### Data Validation
- **ISO 8601 Format**: Strict datetime validation with UTC timezone requirement
- **Future Appointments Only**: Prevents booking appointments in the past
- **Time Logic Validation**: Ensures start time is before end time
- **Required Field Validation**: Comprehensive input validation

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Testing**: Jest + Supertest for integration testing
- **Documentation**: Redoc + OpenAPI 3.0
- **Development**: tsx for hot reloading

### tsx Hot Reloading Explained
**tsx** is a TypeScript execution engine that provides seamless development experience:

- **What it is**: Fast TypeScript runner that compiles and executes `.ts` files directly
- **How it works**: Watches your TypeScript files and automatically restarts the server when changes are detected
- **Why we need it**: Eliminates manual server restarts during development, speeding up the development cycle
- **vs ts-node**: tsx is faster with better ESM (ES Modules) support and modern TypeScript features
- **In our code**: `package.json` script `"dev": "tsx src/app.ts"` enables hot reloading
- **Production**: tsx is only for development; production uses compiled JavaScript

**Benefits for development:**
- Save code → Server restarts automatically
- Zero build configuration required
- Fast feedback loop during development
- Direct TypeScript execution without compilation step

## 📊 Database Schema

### Tables
- **appointments**: Core appointment data with foreign keys
- **clinicians**: Clinician profiles (auto-created)
- **patients**: Patient profiles (auto-created)

### ACID Compliance
- **Transactions**: Appointment creation uses database transactions
- **Concurrency Safety**: Overlap detection within transaction boundaries
- **Data Integrity**: Foreign key constraints and validation

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### API Endpoints

#### Health Check
```
GET /health
```

#### Create Appointment
```
POST /appointments
Headers: x-role: patient|admin
Body: {
  "clinicianId": "dr-smith-123",
  "patientId": "patient-456", 
  "start": "2025-12-01T09:00:00Z",
  "end": "2025-12-01T10:00:00Z"
}
```

#### Get All Appointments (Admin Only)
```
GET /appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z
Headers: x-role: admin
```

#### Get Clinician Appointments
```
GET /clinicians/{id}/appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z
Headers: x-role: clinician|admin
```

### Role-Based Access Control

| Endpoint | Patient | Clinician | Admin |
|----------|---------|-----------|--------|
| POST /appointments | ✅ | ❌ | ✅ |
| GET /appointments | ❌ | ❌ | ✅ |
| GET /clinicians/{id}/appointments | ❌ | ✅ | ✅ |

## 💻 cURL Examples

Test the API using these curl commands (ensure server is running with `npm run dev`):

### 1. Health Check
```bash
curl -X GET http://localhost:3000/health
```

### 2. Create Appointment (Patient Role)
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "x-role: patient" \
  -d '{
    "clinicianId": "dr-smith-123",
    "patientId": "patient-456",
    "start": "2025-12-01T09:00:00Z",
    "end": "2025-12-01T10:00:00Z"
  }'
```

### 3. Get All Appointments (Admin Role)
```bash
curl -X GET http://localhost:3000/appointments \
  -H "x-role: admin"
```

## 🧪 Testing

The project includes comprehensive test coverage with both unit and integration tests:

### Test Structure
```
__tests__/
├── integration/           # End-to-end API tests
│   ├── appointments.post.test.ts
│   ├── appointments.get.test.ts
│   └── clinicians.get.test.ts
└── unit/                  # Service layer tests
    └── services/
        ├── appointmentService.test.ts
        ├── appointmentService.overlap.test.ts
        └── appointmentService.autocreate.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Categories

#### Integration Tests
- **HTTP Request/Response**: Full API endpoint testing
- **Role-Based Access**: Authentication and authorization testing
- **Error Handling**: Comprehensive error scenario coverage
- **Data Validation**: Input validation and edge cases

#### Unit Tests
- **Business Logic**: Service layer functionality
- **Overlap Detection**: Appointment conflict algorithms  
- **Auto-Creation**: Automatic clinician/patient creation
- **Date Validation**: Timezone and format validation

## 📖 API Documentation

### Accessing Documentation
Visit `http://localhost:3000/api-docs` when the server is running or check the deployed link at `https://pgd1998.github.io/lyrebird-coding-challenge/`to view the interactive API documentation.

### Documentation Features
- **Professional Styling**: Clean, readable Redoc interface
- **Comprehensive Examples**: Request/response examples for all endpoints
- **Schema Definitions**: Detailed data models and validation rules
- **Error Documentation**: Complete error response documentation
- **No Interactive Playground**: Static documentation (read-only)

### Generating Documentation
```bash
# Regenerate static documentation
npm run docs:build
```

This command:
1. Reads the OpenAPI specification from `docs/openapi.yaml`
2. Generates static HTML using redoc-cli
3. Outputs to `docs/index.html` 
4. Served automatically by Express at `/api-docs`

### Documentation Architecture
The documentation system uses a **specification-first approach**:

1. **OpenAPI YAML**: Single source of truth (`docs/openapi.yaml`)
2. **Static Generation**: Redoc CLI generates self-contained HTML
3. **Express Integration**: Static files served via Express middleware
4. **No Runtime Dependencies**: Documentation works without external services

## 🔧 Development Patterns

### Code Organization
- **Separation of Concerns**: Controllers handle HTTP, services handle business logic
- **Type Safety**: Comprehensive TypeScript interfaces and validation
- **Error Handling**: Centralized error handling with appropriate HTTP status codes
- **Clean Code**: No inline documentation comments, self-documenting code

### Database Patterns
- **Transaction Safety**: Critical operations wrapped in database transactions
- **Auto-Creation**: Defensive programming with automatic entity creation
- **Query Optimization**: Indexed queries with parameterized statements
- **UTC Consistency**: All datetime operations in UTC timezone

### API Design Patterns
- **RESTful Design**: Standard HTTP verbs and status codes
- **Header-Based Auth**: Simple role-based authentication via x-role header
- **Consistent Responses**: Standardized error and success response formats
- **Query Parameters**: Flexible filtering with optional date ranges

## ⚠️ Trade-offs and Limitations

### Authentication System
**Trade-off**: Uses simple header-based role authentication (`x-role: patient|clinician|admin`) instead of JWT tokens or OAuth.

**Reasoning**: Simplified implementation for development/demo purposes.

**Limitation**: Not suitable for production without proper authentication middleware.

**Production Alternative**: Implement JWT-based authentication with proper user sessions and token validation.

### Database Choice  
**Trade-off**: SQLite instead of PostgreSQL/MySQL for production workloads.

**Reasoning**: Zero-configuration setup, perfect for development and testing.

**Limitation**: No horizontal scaling, limited concurrent write performance.

**Production Alternative**: PostgreSQL with connection pooling for scalability.

### Auto-Creation Pattern
**Trade-off**: Automatically creates clinicians and patients if they don't exist.

**Reasoning**: Simplifies API usage and reduces complexity for demo purposes.

**Limitation**: May create unwanted entities, no validation of entity existence.

**Production Alternative**: Require explicit entity creation with proper validation.

### Error Handling
**Trade-off**: Generic error messages in some cases instead of detailed validation errors.

**Reasoning**: Simplified error handling reduces complexity.

**Limitation**: Less helpful for API consumers debugging issues.

**Production Alternative**: Implement detailed validation error responses with field-specific messages.

### Documentation Approach
**Trade-off**: Static documentation generation vs. runtime-generated docs.

**Reasoning**: Better performance, no runtime dependencies, professional styling.

**Limitation**: No interactive API testing playground.

**Alternative**: Could implement Swagger UI alongside Redoc for interactive testing.

## 🚀 Production Readiness Checklist

For production deployment, consider implementing:

- [ ] **Authentication**: JWT-based authentication system
- [ ] **Authorization**: Proper role-based access control with user management
- [ ] **Database**: PostgreSQL with connection pooling
- [ ] **Validation**: Comprehensive input validation with detailed error messages
- [ ] **Logging**: Structured logging with request/response tracking  
- [ ] **Monitoring**: Health checks, metrics, and alerting
- [ ] **Rate Limiting**: API rate limiting to prevent abuse
- [ ] **HTTPS**: SSL/TLS encryption for all API communications
- [ ] **Environment Config**: Proper configuration management for different environments
- [ ] **Error Handling**: Global error handling middleware
- [ ] **Data Migration**: Database migration system for schema changes

## 📋 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode  
npm run test:coverage # Run tests with coverage report
npm run docs:build   # Regenerate API documentation
```

## 🏛️ Project Structure

```
lyrebird-coding-challenge/
├── src/
│   ├── app.ts                      # Express application setup
│   ├── database.ts                 # SQLite database configuration
│   ├── types.ts                    # TypeScript type definitions
│   ├── controllers/
│   │   └── appointmentController.ts # HTTP request handlers
│   └── services/
│       └── appointmentService.ts    # Business logic layer
├── __tests__/
│   ├── integration/                # API integration tests
│   └── unit/                       # Service unit tests
├── docs/
│   ├── openapi.yaml               # OpenAPI 3.0 specification
│   └── index.html                 # Generated Redoc documentation
├── package.json                   # Dependencies and scripts
├── jest.config.js                 # Jest testing configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This documentation
```

---