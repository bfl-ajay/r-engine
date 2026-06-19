# API Specifications - Reporting Engine

**Document Version:** 1.0  
**Date:** 2026-06-19  
**Status:** Final

---

## 1. API Overview

### 1.1 API Standards
- **Protocol**: RESTful HTTP/HTTPS (TLS 1.3)
- **Format**: JSON (with support for XML where applicable)
- **Authentication**: Bearer Token (JWT), OAuth 2.0
- **Version**: v1
- **Base URL**: `https://api.reporting.example.com/api/v1`

### 1.2 HTTP Methods
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update entire resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources

### 1.3 Status Codes
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Conflict with existing resource
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## 2. Authentication & Authorization

### 2.1 Authentication Endpoints

#### POST /auth/login
**Description**: User login with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_value",
  "expiresIn": 3600,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user", "report_designer"]
  }
}
```

#### POST /auth/refresh
**Description**: Refresh access token

**Request**:
```json
{
  "refreshToken": "refresh_token_value"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "new_access_token",
  "expiresIn": 3600
}
```

#### POST /auth/logout
**Description**: Logout user (invalidate tokens)

**Request**: No body required

**Response** (204 No Content)

### 2.2 OAuth 2.0 Integration

#### GET /auth/oauth/authorize
**Description**: OAuth authorization endpoint

**Parameters**:
- `client_id`: Application ID
- `redirect_uri`: Callback URL
- `scope`: Space-separated scopes (read, write, admin)
- `state`: CSRF protection token
- `response_type`: Always 'code'

#### POST /auth/oauth/token
**Description**: Get access token using authorization code

**Request**:
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code",
  "client_id": "client_id",
  "client_secret": "client_secret",
  "redirect_uri": "https://example.com/callback"
}
```

---

## 3. Report Design API

### 3.1 Report CRUD Operations

#### GET /reports
**Description**: List all reports with pagination and filtering

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20, max: 100)
- `search`: Search by name/description
- `status`: Filter by status (draft, published, archived)
- `createdBy`: Filter by creator
- `sortBy`: Sort field (name, createdAt, updatedAt)
- `sortOrder`: asc or desc

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "report-uuid",
      "name": "Sales Report",
      "description": "Monthly sales data",
      "status": "published",
      "version": "2.1.0",
      "createdBy": "user-uuid",
      "createdAt": "2026-06-19T10:00:00Z",
      "updatedAt": "2026-06-19T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### POST /reports
**Description**: Create a new report

**Request**:
```json
{
  "name": "Sales Report",
  "description": "Monthly sales analysis",
  "templateId": "template-uuid",
  "definition": {
    "bands": [...],
    "dataSources": [...],
    "parameters": [...],
    "styles": [...]
  }
}
```

**Response** (201 Created):
```json
{
  "id": "report-uuid",
  "name": "Sales Report",
  "description": "Monthly sales analysis",
  "status": "draft",
  "version": "1.0.0",
  "createdAt": "2026-06-19T10:00:00Z"
}
```

#### GET /reports/{reportId}
**Description**: Get report details

**Response** (200 OK):
```json
{
  "id": "report-uuid",
  "name": "Sales Report",
  "description": "Monthly sales analysis",
  "definition": {
    "bands": [
      {
        "id": "band-1",
        "name": "Report Title",
        "type": "report_title",
        "height": 50,
        "objects": [...]
      }
    ]
  },
  "status": "draft",
  "version": "1.0.0",
  "createdBy": "user-uuid",
  "createdAt": "2026-06-19T10:00:00Z",
  "updatedAt": "2026-06-19T10:00:00Z"
}
```

#### PUT /reports/{reportId}
**Description**: Update entire report

**Request**:
```json
{
  "name": "Sales Report Updated",
  "description": "Updated description",
  "definition": {...}
}
```

**Response** (200 OK):
```json
{
  "id": "report-uuid",
  "name": "Sales Report Updated",
  "updatedAt": "2026-06-19T15:00:00Z"
}
```

#### PATCH /reports/{reportId}
**Description**: Partial update to report

**Request**:
```json
{
  "description": "New description only"
}
```

**Response** (200 OK)

#### DELETE /reports/{reportId}
**Description**: Delete report (soft delete)

**Response** (204 No Content)

### 3.2 Report Object Management

#### POST /reports/{reportId}/objects
**Description**: Add object to report band

**Request**:
```json
{
  "bandId": "band-id",
  "type": "text",
  "x": 100,
  "y": 50,
  "width": 200,
  "height": 30,
  "properties": {
    "text": "Sales Total",
    "fontSize": 12,
    "fontWeight": "bold"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "object-uuid",
  "bandId": "band-id",
  "type": "text",
  "x": 100,
  "y": 50
}
```

#### PUT /reports/{reportId}/objects/{objectId}
**Description**: Update report object

**Request**:
```json
{
  "x": 120,
  "y": 60,
  "properties": {
    "text": "Updated Text"
  }
}
```

**Response** (200 OK)

#### DELETE /reports/{reportId}/objects/{objectId}
**Description**: Delete report object

**Response** (204 No Content)

---

## 4. Report Execution API

### 4.1 Execute Report

#### POST /reports/{reportId}/execute
**Description**: Execute report with parameters

**Request**:
```json
{
  "parameters": {
    "startDate": "2026-01-01",
    "endDate": "2026-06-30",
    "department": "Sales"
  },
  "format": "interactive",
  "paginate": true,
  "pageSize": 50
}
```

**Response** (202 Accepted):
```json
{
  "instanceId": "instance-uuid",
  "status": "pending",
  "createdAt": "2026-06-19T10:00:00Z"
}
```

#### GET /reports/{reportId}/executions/{instanceId}
**Description**: Get report execution status

**Response** (200 OK):
```json
{
  "id": "instance-uuid",
  "reportId": "report-uuid",
  "status": "completed",
  "executionStart": "2026-06-19T10:00:00Z",
  "executionEnd": "2026-06-19T10:00:05Z",
  "totalPages": 25,
  "totalRecords": 1250,
  "errorMessage": null
}
```

#### GET /reports/{reportId}/executions/{instanceId}/pages/{pageNumber}
**Description**: Get specific page from executed report

**Response** (200 OK):
```json
{
  "pageNumber": 1,
  "content": "<html>...</html>",
  "contentType": "html",
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

#### GET /reports/{reportId}/executions/{instanceId}/stream
**Description**: Stream report pages (Server-Sent Events)

**Response**: Stream of page data

---

## 5. Template Management API

### 5.1 Template CRUD

#### GET /templates
**Description**: List all report templates

**Query Parameters**:
- `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "template-uuid",
      "name": "Standard Report Template",
      "description": "Base template for all reports",
      "baseTemplateId": null,
      "status": "published",
      "version": "1.0.0",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### POST /templates
**Description**: Create new template

**Request**:
```json
{
  "name": "Sales Report Template",
  "description": "Template for sales reports",
  "baseTemplateId": "base-template-uuid",
  "definition": {
    "bands": [...],
    "styles": [...]
  }
}
```

**Response** (201 Created)

#### GET /templates/{templateId}
**Description**: Get template details

#### PUT /templates/{templateId}
**Description**: Update template

#### DELETE /templates/{templateId}
**Description**: Delete template

### 5.2 Template Versioning

#### GET /templates/{templateId}/versions
**Description**: Get all template versions

**Response** (200 OK):
```json
{
  "data": [
    {
      "versionNumber": "2.0.0",
      "createdAt": "2026-06-10T00:00:00Z",
      "createdBy": "user-uuid",
      "changeLog": "Updated header styling"
    }
  ]
}
```

#### POST /templates/{templateId}/versions/{versionId}/rollback
**Description**: Rollback to specific template version

**Response** (200 OK)

### 5.3 Template Cloning

#### POST /templates/{templateId}/clone
**Description**: Clone template with new name

**Request**:
```json
{
  "newName": "Sales Report Template - Copy"
}
```

**Response** (201 Created)

---

## 6. Data Source API

### 6.1 Data Source Management

#### GET /datasources
**Description**: List all data sources

**Query Parameters**:
- `page`, `limit`, `search`, `type`, `status`

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "datasource-uuid",
      "name": "Production Database",
      "type": "postgresql",
      "status": "active",
      "lastStatusCheck": "2026-06-19T15:30:00Z",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### POST /datasources
**Description**: Create new data source

**Request**:
```json
{
  "name": "Production Database",
  "type": "postgresql",
  "connectionConfig": {
    "host": "db.example.com",
    "port": 5432,
    "database": "production",
    "username": "reportuser",
    "password": "encrypted_password"
  }
}
```

**Response** (201 Created)

#### GET /datasources/{datasourceId}
**Description**: Get data source details

#### PUT /datasources/{datasourceId}
**Description**: Update data source

#### DELETE /datasources/{datasourceId}
**Description**: Delete data source

#### POST /datasources/{datasourceId}/test
**Description**: Test data source connection

**Response** (200 OK):
```json
{
  "status": "connected",
  "message": "Connection successful",
  "responseTime": 125
}
```

### 6.2 Query Management

#### GET /datasources/{datasourceId}/queries
**Description**: List all queries for a data source

#### POST /datasources/{datasourceId}/queries
**Description**: Create new query

**Request**:
```json
{
  "name": "Sales by Region",
  "queryText": "SELECT region, SUM(amount) FROM sales GROUP BY region",
  "queryType": "sql",
  "parameters": [
    {
      "name": "startDate",
      "type": "date",
      "required": true
    }
  ]
}
```

**Response** (201 Created)

#### POST /datasources/{datasourceId}/queries/{queryId}/preview
**Description**: Preview query results (limited to 100 rows)

**Request**:
```json
{
  "parameters": {
    "startDate": "2026-01-01"
  },
  "limit": 100
}
```

**Response** (200 OK):
```json
{
  "columns": ["region", "amount"],
  "data": [
    ["North", 150000],
    ["South", 120000]
  ],
  "rowCount": 100
}
```

---

## 7. Export API

### 7.1 Report Export

#### POST /reports/{reportId}/executions/{instanceId}/export
**Description**: Export report to specified format

**Request**:
```json
{
  "format": "pdf",
  "options": {
    "orientation": "landscape",
    "pageSize": "A4",
    "includeWatermark": true
  }
}
```

**Response** (202 Accepted):
```json
{
  "jobId": "export-job-uuid",
  "status": "pending",
  "estimatedTime": 30,
  "format": "pdf"
}
```

#### GET /exports/{jobId}
**Description**: Get export job status

**Response** (200 OK):
```json
{
  "id": "export-job-uuid",
  "status": "completed",
  "format": "pdf",
  "fileSize": 2048576,
  "downloadUrl": "/downloads/report-2026-06-19.pdf",
  "expiresAt": "2026-06-26T10:00:00Z"
}
```

#### GET /exports/{jobId}/download
**Description**: Download exported file

**Response** (200 OK): Binary file

#### DELETE /exports/{jobId}
**Description**: Cancel/delete export job

---

## 8. User Management API

### 8.1 User CRUD

#### GET /admin/users
**Description**: List all users (admin only)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "roles": ["user", "report_designer"],
      "createdAt": "2026-05-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### POST /admin/users
**Description**: Create new user

**Request**:
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "password": "initial_password",
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

#### PUT /admin/users/{userId}
**Description**: Update user

#### DELETE /admin/users/{userId}
**Description**: Delete user

### 8.2 Role Management

#### GET /admin/roles
**Description**: List all roles

#### POST /admin/roles
**Description**: Create new role

#### PUT /admin/roles/{roleId}
**Description**: Update role

#### DELETE /admin/roles/{roleId}
**Description**: Delete role

### 8.3 Permission Assignment

#### POST /admin/roles/{roleId}/permissions/{permissionId}
**Description**: Assign permission to role

#### DELETE /admin/roles/{roleId}/permissions/{permissionId}
**Description**: Remove permission from role

---

## 9. Audit & Administration API

### 9.1 Audit Logs

#### GET /admin/audit-logs
**Description**: List audit logs

**Query Parameters**:
- `page`, `limit`
- `userId`: Filter by user
- `resourceType`: Filter by resource type
- `action`: Filter by action
- `fromDate`: Start date
- `toDate`: End date

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "action": "create",
      "resourceType": "report",
      "resourceId": "report-uuid",
      "resourceName": "Sales Report",
      "changeSummary": {
        "name": "Sales Report",
        "status": "draft"
      },
      "timestamp": "2026-06-19T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### 9.2 System Configuration

#### GET /admin/config
**Description**: Get system configuration

#### PUT /admin/config
**Description**: Update system configuration

---

## 10. Error Handling

### 10.1 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 422,
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "REQUIRED"
      }
    ],
    "requestId": "req-uuid"
  }
}
```

### 10.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_INPUT | 400 | Invalid request input |
| UNAUTHORIZED | 401 | Missing authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| VALIDATION_ERROR | 422 | Validation error |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service unavailable |

---

## 11. Rate Limiting

### 11.1 Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1624088400
```

### 11.2 Rate Limit Tiers

| Tier | Requests/hour | Burst |
|------|---------------|-------|
| Free | 100 | 10 |
| Pro | 1000 | 50 |
| Enterprise | 10000 | 500 |

---

## 12. Pagination

### 12.1 Pagination Parameters

- `page`: Page number (1-indexed, default: 1)
- `limit`: Records per page (default: 20, max: 100)

### 12.2 Pagination Response

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 13. Filtering & Searching

### 13.1 Search Syntax
- Exact match: `name:"exact name"`
- Contains: `description~"keyword"`
- Greater than: `createdAt>2026-01-01`
- Less than: `createdAt<2026-12-31`
- In list: `status:(draft,published)`

### 13.2 Sorting
- Single field: `sortBy=createdAt&sortOrder=desc`
- Multiple fields: `sortBy=createdAt,name&sortOrder=desc,asc`

---

## 14. Versioning

### 14.1 API Versioning Strategy
- URI-based versioning: `/api/v1/...`
- Support multiple major versions
- Deprecation: 12-month notice before removal

### 14.2 Version Negotiation
```
Accept: application/vnd.reporting.v1+json
```

---

## 15. Webhooks (Optional for Future)

### 15.1 Webhook Events

- `report.executed`: Report execution completed
- `export.completed`: Export job completed
- `error.occurred`: System error occurred

### 15.2 Webhook Payload

```json
{
  "event": "report.executed",
  "timestamp": "2026-06-19T10:00:00Z",
  "data": {
    "reportId": "report-uuid",
    "instanceId": "instance-uuid",
    "status": "completed"
  }
}
```

---

**End of Document**
