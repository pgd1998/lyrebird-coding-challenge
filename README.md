# Clinic Appointment System Backend
## Lyrebird Health Coding Challenge - TypeScript Implementation

A comprehensive RESTful API for managing clinic appointments with role-based access control, automatic conflict detection, and professional API documentation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation & Running
```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## 📋 API Endpoints

### 1. Create Appointment
```http
POST /appointments
Content-Type: application/json
x-role: patient|admin

{
  "clinicianId": "dr-smith-123",
  "patientId": "patient-456",
  "start": "2025-12-01T09:00:00Z",
  "end": "2025-12-01T10:00:00Z"
}
```

**Behavior:**
- ✅ Validates `start < end` and ISO datetime format
- ✅ Auto-creates clinician & patient records if they don't exist
- ✅ Rejects overlapping appointments for same clinician
- ✅ Returns `201 Created` on success
- ✅ Returns `409 Conflict` on overlap, `400 Bad Request` on invalid input

### 2. List Clinician's Appointments
```http
GET /clinicians/{id}/appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z
x-role: clinician|admin
```

**Behavior:**
- ✅ Returns appointments with `start >= now` (or respects from/to)
- ✅ Returns `200 OK` with JSON array

### 3. Admin: List All Appointments
```http
GET /appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z
x-role: admin
```

**Behavior:**
- ✅ Returns all upcoming appointments with optional date range filtering
- ✅ Returns `200 OK` with JSON array

---

## 💻 Example cURL Commands

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### Create Appointment (Patient Role)
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

### List Clinician Appointments
```bash
curl -X GET "http://localhost:3000/clinicians/dr-smith-123/appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "x-role: clinician"
```

### Admin: List All Appointments
```bash
curl -X GET "http://localhost:3000/appointments?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "x-role: admin"
```

### Test Overlap Detection (Should Return 409)
```bash
# First appointment
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "x-role: patient" \
  -d '{
    "clinicianId": "dr-smith-123",
    "patientId": "patient-1",
    "start": "2025-12-01T14:00:00Z",
    "end": "2025-12-01T15:00:00Z"
  }'

# Conflicting appointment (should fail with 409)
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "x-role: patient" \
  -d '{
    "clinicianId": "dr-smith-123",
    "patientId": "patient-2",
    "start": "2025-12-01T14:30:00Z",
    "end": "2025-12-01T15:30:00Z"
  }'
```

---

## 🏗️ Architecture & Design Decisions

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js (lightweight, mature)
- **Database**: SQLite with better-sqlite3 (embedded, ACID compliant)
- **Testing**: Jest + Supertest (comprehensive integration testing)
- **Documentation**: OpenAPI 3.0 + Redoc (professional API docs)
- **Development**: tsx for hot reloading (fast development cycle)

### Key Design Decisions

#### 1. Database Choice: SQLite
**Reasoning**: Perfect for coding challenge requirements - embedded, requires no setup, ACID compliant, supports transactions.
**Trade-off**: Not suitable for production scale, but ideal for development/testing.
**Production Alternative**: PostgreSQL with connection pooling.

#### 2. Role-Based Access via Headers
**Reasoning**: Used `x-role` header instead of query parameters for better security practices.
**Implementation**: Simple but effective for demonstrating access control patterns.
**Admin Appointment Creation**: Allowed admins to create appointments under the practical justification that administrative staff often handle patient bookings in real clinic environments.
**Production Alternative**: JWT-based authentication with proper user management.

#### 3. Overlap Detection Algorithm
```sql
SELECT id FROM appointments 
WHERE clinician_id = ? 
AND start_time < ? -- new end
AND end_time > ?   -- new start
```
**Reasoning**: This correctly detects all overlap scenarios while allowing touching appointments.
**Edge Cases Handled**: 
- ✅ Partial overlaps
- ✅ Complete overlaps  
- ✅ Touching endpoints allowed (as specified)

#### 4. Concurrency Safety
**Implementation**: Database transactions ensure atomic operations.
```typescript
const result = db.transaction(() => {
  // Check for overlaps
  // Create appointment
  // Return result
})();
```
**Race Condition Handling**: Transaction boundaries prevent overlapping appointments even under concurrent requests.

#### 5. Auto-Creation Strategy
**Reasoning**: Automatically creates clinician/patient records for development simplicity.
**Trade-off**: Production systems would require explicit entity management.
**Benefit**: Reduces API complexity for testing scenarios.

### Input Validation Rules Compliance

✅ **ISO Datetime Validation**: Strict format checking with timezone requirements  
✅ **Start < End Validation**: Prevents zero/negative length appointments  
✅ **Overlap Logic**: Correctly implements intersection detection  
✅ **Past Appointment Rejection**: Uses UTC for consistency  

---

## 🧪 Test Coverage

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure
```
__tests__/
├── integration/           # End-to-end API tests  
│   ├── appointments.post.test.ts    # Create appointment scenarios
│   ├── appointments.get.test.ts     # Admin list functionality
│   └── clinicians.get.test.ts       # Clinician schedule retrieval
└── unit/                  # Business logic tests
    └── services/
        ├── appointmentService.test.ts        # Core service logic
        ├── appointmentService.overlap.test.ts # Overlap detection
        └── appointmentService.autocreate.test.ts # Auto-creation logic
```

### Key Test Scenarios
- ✅ **Creating appointments** with valid data
- ✅ **Rejecting overlapping appointments** (exact matches, partial overlaps)
- ✅ **Listing clinician appointments** with date filtering
- ✅ **Date-range filtering** functionality
- ✅ **Role-based access control** enforcement
- ✅ **Edge cases**: touching appointments, past dates, invalid formats

---

## 📖 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` when server is running, or check the deployed documentation at:
**https://pgd1998.github.io/lyrebird-coding-challenge/**

### Features
- ✅ **Professional Redoc Interface**: Clean, readable documentation
- ✅ **Complete Schema Definitions**: All request/response models documented
- ✅ **Example Requests**: Working examples for all endpoints
- ✅ **Error Response Documentation**: All HTTP status codes explained

### Regenerating Documentation
```bash
npm run docs:build
```

---

## 🚀 Bonus Features Implemented

### ✅ OpenAPI/Swagger Documentation
Professional API documentation with:
- Interactive schema browser
- Complete request/response examples
- Role-based endpoint documentation

### ✅ Role-Based Access Control  
Header-based authentication simulation:
```
x-role: patient   # Can create appointments
x-role: clinician # Can view own appointments  
x-role: admin     # Full access to all endpoints
```

### ✅ Concurrency-Safe Appointment Creation
Database transactions prevent race conditions:
- Overlap detection within transaction boundaries
- Atomic operation ensures data consistency
- ACID compliance via SQLite

### ✅ Professional Code Organization
```
src/
├── app.ts                 # Express application setup
├── database.ts           # Database configuration & schema
├── types.ts             # TypeScript interfaces
├── controllers/         # HTTP request handlers
└── services/           # Business logic layer
```

---

## 🔧 Trade-offs & Limitations

### Current Limitations
1. **Simplified Authentication**: Header-based roles (not production-ready)
2. **In-Memory Database**: SQLite file (not suitable for distributed systems)
3. **Basic Error Messages**: Simplified for development (production needs detailed validation errors)
4. **No Pagination**: Admin endpoint returns all results (should implement pagination for large datasets)

### Production Considerations
- **Authentication**: Implement JWT-based system with proper user management
- **Database**: Migrate to PostgreSQL with connection pooling
- **Validation**: Add comprehensive input validation with detailed error messages
- **Monitoring**: Implement logging, health checks, and metrics
- **Security**: Add rate limiting, HTTPS enforcement, input sanitization

---

## 📊 Project Structure

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

## 📋 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode  
npm run test:coverage # Run tests with coverage report
npm run docs:build   # Regenerate API documentation
```

---

**Focus**: Correctness, code clarity, and comprehensive validation as requested.  
**Bonus Features**: OpenAPI docs, role-based access, concurrency safety, professional documentation.