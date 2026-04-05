# API Documentation - Swagger UI Guide

The backend includes interactive API documentation via Swagger UI. This allows you to:
- View all API endpoints and their specifications
- Test endpoints directly from the browser with request/response schemas
- Authenticate with JWT tokens
- See live documentation that matches your API

## Accessing Swagger UI

Once the server is running:

```
http://localhost:4000/api-docs
```

## Features

### 1. Interactive Testing
- **Try it out**: Each endpoint has an interactive form to send requests
- **Pre-filled examples**: Request bodies show example data
- **Response preview**: See successful responses and error codes
- **Authentication**: Paste your JWT token to test protected endpoints

### 2. Endpoint Documentation
- All 13 endpoints fully documented with:
  - Request parameters (path, query, body)
  - Request/response body schemas with validation rules
  - HTTP status codes and error messages
  - Security requirements (JWT Bearer token)
  - Example values

### 3. Schema Definitions
- User schema: id, name, email, role, isActive, timestamps
- Transaction schema: amount, type, category, date, notes, soft_delete
- Summary schema: totals, category breakdown, recent transactions
- Error schema: standardized error response format

## Using Swagger UI

### Step 1: Authentication

1. Click **Authorize** button (lock icon, top right)
2. Copy your JWT token from login response
3. Paste in the format: `Bearer <your_token_here>`
4. Click **Authorize** and then **Close**

All subsequent requests will include your token.

### Step 2: Test an Endpoint

Example: Get all transactions

1. Expand **Transactions** section
2. Click **GET /transactions**
3. Click **Try it out**
4. Adjust query parameters if needed:
   - `limit`: 20 (default)
   - `offset`: 0 (for pagination)
   - `category`: optional filter
   - `type`: income/expense filter
   - `dateFrom`, `dateTo`: date range
5. Click **Execute**
6. See the response in the **Response** section

### Step 3: Create a Resource

Example: Create a new transaction

1. Expand **Transactions**
2. Click **POST /transactions**
3. Click **Try it out**
4. Modify request body in the editor:
```json
{
  "amount": 1500,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-04T10:00:00Z",
  "notes": "Monthly salary"
}
```
5. Click **Execute**
6. See 201 Created response with the created transaction

## Complete Endpoint Reference

### Authentication (No Token Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user → VIEWER role |
| POST | /auth/login | Login user → returns JWT token |

### Users (ADMIN Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List all users |
| POST | /users | Create user (with optional role) |
| PATCH | /users/{id} | Update user (self or admin) |

### Transactions (All Roles View, ADMIN Modify)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /transactions | List user's transactions (with filters) |
| POST | /transactions | Create transaction (ADMIN) |
| PUT | /transactions/{id} | Update transaction (ADMIN) |
| DELETE | /transactions/{id} | Soft-delete transaction (ADMIN) |

### Dashboard (ANALYST, ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dashboard/summary | Get income/expense summary & analytics |
| GET | /dashboard/trends | Get monthly income/expense trends |

## Testing Workflow in Swagger UI

### 1. Register & Login

1. **POST /auth/register**
   - Body: `{ "name": "Test User", "email": "test@example.com", "password": "Password123!" }`
   - Copy the `token` from response

2. **POST /auth/login**
   - Body: `{ "email": "test@example.com", "password": "Password123!" }`
   - Copy the new `token`

3. **Authorize** with token (lock icon)

### 2. Create Transactions

1. **POST /transactions**
   - Body: `{ "amount": 2000, "type": "income", "category": "Salary", "date": "2026-04-04" }`
   - Response: 201 Created

2. **POST /transactions** (multiple times with different categories)
   - Create expense: `{ "amount": 500, "type": "expense", "category": "Groceries", ... }`
   - Create another: `{ "amount": 100, "type": "expense", "category": "Transport", ... }`

### 3. Filter Transactions

1. **GET /transactions**
   - Query: `category=Groceries`
   - Response: Only grocery expenses

2. **GET /transactions**
   - Query: `dateFrom=2026-04-01&dateTo=2026-04-30`
   - Response: April transactions

3. **GET /transactions**
   - Query: `offset=10&limit=5`
   - Response: Paginated results (skip 10, take 5)

### 4. View Analytics

1. **GET /dashboard/summary**
   - Response: Total income, expenses, net balance, category breakdown
   - Example: `{ "totalIncome": 2000, "totalExpenses": 600, "netBalance": 1400, ... }`

2. **GET /dashboard/trends**
   - Response: Monthly breakdown
   - Example: `{ "monthly": [{ "month": "2026-04", "income": 2000, "expenses": 600, "net": 1400 }] }`

### 5. RBAC Testing

Create multiple users with different roles:

```
ADMIN user: Can modify transactions, view users
ANALYST user: Can only view analytics/transactions (no modifications)
VIEWER user: Can only view summaries (limited access)
```

Then:
- Try accessing protected endpoints with each role
- See 403 Forbidden when insufficient permissions
- Verify role-based filtering works

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Description of error",
  "code": "ERROR_CODE",
  "errors": [
    {
      "path": "field.name",
      "message": "Field validation message"
    }
  ]
}
```

Common codes:
- `AUTH_REQUIRED` (401): Missing token
- `INVALID_TOKEN` (401): Invalid/expired token
- `FORBIDDEN` (403): Insufficient permissions
- `DUPLICATE_EMAIL` (409): Email already exists
- `TRANSACTION_NOT_FOUND` (404): Resource not found

## Keyboard Shortcuts

- **Ctrl+F**: Search endpoints (browser find)
- **Scroll**: Navigate between endpoints
- **Authorize button**: Manage JWT token

## Persisting Authentication

Swagger UI's "persistAuthorization" option is enabled, so:
- Your token is saved in browser localStorage
- You stay authenticated even after refreshing the page
- Clearing browser data will clear the token

## Troubleshooting

**Problem**: "Unable to render this definition" error
- Solution: Refresh page or check server logs

**Problem**: 401 Unauthorized on all requests
- Solution: Make sure token is pasted with "Bearer " prefix

**Problem**: 403 Forbidden
- Solution: Check user role - may not have permission for endpoint

**Problem**: Validation error (400)
- Solution: Check request body schema in Swagger UI, match required fields and formats

## Next Steps

1. Start the server: `npm run dev`
2. Open: `http://localhost:4000/api-docs`
3. Test endpoints interactively
4. Integrate with your frontend using the documented schemas

---

**Note**: This documentation is auto-generated from OpenAPI 3.0 spec and stays in sync with your API.
