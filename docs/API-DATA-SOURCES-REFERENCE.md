# Data Source Integration API Reference

## Quick Start

### 1. Create a PostgreSQL Connection

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Database",
    "type": "SQL",
    "databaseType": "POSTGRESQL",
    "host": "localhost",
    "port": 5432,
    "database": "reports_db",
    "username": "admin",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "conn-1234567890",
    "name": "Main Database",
    "type": "SQL",
    "databaseType": "POSTGRESQL",
    "host": "localhost",
    "port": 5432,
    "isActive": true
  }
}
```

### 2. Test the Connection

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/connections/conn-1234567890/test
```

### 3. Get Database Schema

```bash
curl http://localhost:8080/api/v1/data-sources/connections/conn-1234567890/schema
```

### 4. Create a Query

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Report Query",
    "connectionId": "conn-1234567890",
    "queryType": "SQL",
    "queryText": "SELECT * FROM sales WHERE date >= :startDate ORDER BY date DESC",
    "timeout": 30000,
    "caching": {
      "enabled": true,
      "duration": 3600
    }
  }'
```

### 5. Execute the Query

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-987654321/execute \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "startDate": "2026-01-01"
    }
  }'
```

### 6. Preview Results (Limited)

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-987654321/preview \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "parameters": { "startDate": "2026-01-01" }
  }'
```

---

## Connection Management API

### POST /api/v1/data-sources/connections

Create a new data source connection.

**Request Body**:
```json
{
  "name": "Connection Name",
  "type": "SQL|MONGODB|API|CSV|JSON",
  "databaseType": "POSTGRESQL|MYSQL|MSSQL|ORACLE",
  "host": "hostname",
  "port": 5432,
  "database": "dbname",
  "username": "user",
  "password": "pass",
  "ssl": true,
  "poolSize": 10,
  "timeout": 30000
}
```

**Response**:
- `201` - Created
- `400` - Validation error
- `500` - Server error

**Examples**:

```bash
# PostgreSQL
curl -X POST http://localhost:8080/api/v1/data-sources/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production DB",
    "type": "SQL",
    "databaseType": "POSTGRESQL",
    "host": "db.prod.internal",
    "port": 5432,
    "database": "reports_db",
    "username": "reporter",
    "password": "secure_pass",
    "ssl": true
  }'

# MongoDB
curl -X POST http://localhost:8080/api/v1/data-sources/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MongoDB Atlas",
    "type": "MONGODB",
    "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/",
    "mongoDatabase": "reports"
  }'

# REST API
curl -X POST http://localhost:8080/api/v1/data-sources/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Third Party API",
    "type": "API",
    "baseUrl": "https://api.example.com/v1",
    "authentication": {
      "type": "BEARER",
      "token": "sk-abcd1234"
    }
  }'

# CSV File
curl -X POST http://localhost:8080/api/v1/data-sources/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Data CSV",
    "type": "CSV",
    "filePath": "/data/sales.csv",
    "hasHeaders": true
  }'
```

---

### GET /api/v1/data-sources/connections

List all connections with pagination.

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20) - Results per page

**Response**:
```json
{
  "success": true,
  "data": [ { /* connection objects */ } ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Examples**:

```bash
# Get first page
curl http://localhost:8080/api/v1/data-sources/connections

# Get page 2 with 50 results
curl "http://localhost:8080/api/v1/data-sources/connections?page=2&limit=50"
```

---

### GET /api/v1/data-sources/connections/:connectionId

Get a specific connection.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "conn-123",
    "name": "Production Database",
    "type": "SQL",
    "databaseType": "POSTGRESQL",
    "host": "db.example.com",
    "port": 5432,
    "database": "mydb",
    "username": "reporter",
    "password": "***ENCRYPTED***",
    "ssl": true,
    "isActive": true,
    "createdAt": "2026-06-19T10:00:00Z"
  }
}
```

---

### PUT /api/v1/data-sources/connections/:connectionId

Update a connection.

**Request Body**: Any fields to update (same as POST)

**Response**: Updated connection object

**Examples**:

```bash
# Update connection name and pool size
curl -X PUT http://localhost:8080/api/v1/data-sources/connections/conn-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Connection Name",
    "poolSize": 30
  }'
```

---

### DELETE /api/v1/data-sources/connections/:connectionId

Delete a connection.

**Response**:
```json
{
  "success": true,
  "message": "Connection deleted"
}
```

---

### POST /api/v1/data-sources/connections/:connectionId/test

Test a connection.

**Response**:
```json
{
  "success": true,
  "message": "Connection successful",
  "executionTime": 145
}
```

**Examples**:

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/connections/conn-123/test
```

---

### GET /api/v1/data-sources/connections/:connectionId/schema

Get the database schema.

**Response**:
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "columns": [
          { "name": "id", "type": "NUMBER", "nullable": false },
          { "name": "name", "type": "STRING", "nullable": false },
          { "name": "email", "type": "STRING", "nullable": true },
          { "name": "created_at", "type": "DATE", "nullable": false }
        ]
      },
      {
        "name": "orders",
        "columns": [
          { "name": "id", "type": "NUMBER" },
          { "name": "user_id", "type": "NUMBER" },
          { "name": "total", "type": "NUMBER" }
        ]
      }
    ]
  }
}
```

**Examples**:

```bash
curl http://localhost:8080/api/v1/data-sources/connections/conn-123/schema
```

---

## Query Management API

### POST /api/v1/data-sources/queries

Create a new query definition.

**Request Body**:
```json
{
  "name": "Query Name",
  "connectionId": "conn-123",
  "queryType": "SQL|MONGODB|GRAPHQL|REST",
  "queryText": "SELECT * FROM users WHERE status = :status",
  "timeout": 30000,
  "caching": {
    "enabled": true,
    "duration": 3600
  },
  "pagination": {
    "enabled": true,
    "pageSize": 100
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "query-123",
    "name": "Active Users",
    "connectionId": "conn-123",
    "queryType": "SQL",
    "queryText": "SELECT * FROM users WHERE status = :status",
    "timeout": 30000
  }
}
```

---

### GET /api/v1/data-sources/queries/:queryId

Get a specific query.

**Response**: Query definition object

---

### POST /api/v1/data-sources/queries/:queryId/execute

Execute a query and get results.

**Request Body**:
```json
{
  "parameters": {
    "status": "active"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Alice", "status": "active" },
    { "id": 2, "name": "Bob", "status": "active" }
  ],
  "rowCount": 2,
  "executionTime": 142
}
```

**Examples**:

```bash
# Simple execution
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-123/execute \
  -H "Content-Type: application/json" \
  -d '{"parameters": {}}'

# With parameters
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-123/execute \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "status": "active"
    }
  }'
```

---

### POST /api/v1/data-sources/queries/:queryId/preview

Preview query results (limited to N rows).

**Request Body**:
```json
{
  "limit": 10,
  "parameters": { /* optional */ }
}
```

**Response**: Same as execute but limited to `limit` rows

**Examples**:

```bash
# Preview first 5 rows
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-123/preview \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 5,
    "parameters": { "status": "active" }
  }'
```

---

### GET /api/v1/data-sources/connections/:connectionId/queries

List queries for a connection.

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)

**Response**: Paginated query list

---

## Utility Endpoints

### POST /api/v1/data-sources/validate-query

Validate query syntax.

**Request Body**:
```json
{
  "query": "SELECT * FROM users"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Query is valid"
}
```

---

### GET /api/v1/data-sources/info

Get system information.

**Response**:
```json
{
  "success": true,
  "data": {
    "supportedTypes": ["SQL", "MONGODB", "API", "CSV", "JSON", "XML", "EXCEL"],
    "supportedDatabases": ["POSTGRESQL", "MYSQL", "MSSQL", "ORACLE"],
    "supportedAuth": ["NONE", "BASIC", "BEARER", "OAUTH"],
    "features": {
      "queryBuilder": true,
      "schemaIntrospection": true,
      "caching": true,
      "pagination": true
    }
  }
}
```

---

## Query Examples by Type

### SQL Query

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales by Region",
    "connectionId": "conn-postgres",
    "queryType": "SQL",
    "queryText": "
      SELECT 
        region,
        SUM(amount) as total,
        COUNT(*) as count
      FROM sales
      WHERE date >= :startDate
      GROUP BY region
      ORDER BY total DESC
    "
  }'
```

### MongoDB Query

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Users by Status",
    "connectionId": "conn-mongo",
    "queryType": "MONGODB",
    "queryText": "[
      {\"$match\": {\"status\": \"active\"}},
      {\"$group\": {\"_id\": \"$country\", \"count\": {\"$sum\": 1}}},
      {\"$sort\": {\"count\": -1}}
    ]"
  }'
```

### REST API Query

```bash
curl -X POST http://localhost:8080/api/v1/data-sources/queries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub Users API",
    "connectionId": "conn-api",
    "queryType": "REST",
    "queryText": "{
      \"method\": \"GET\",
      \"path\": \"/users\",
      \"query\": {\"sort\": \"followers\", \"order\": \"desc\"}
    }"
  }'
```

---

## Error Handling

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Connection name is required"
  }
}
```

### Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Connection not found"
  }
}
```

### Query Execution Error

```json
{
  "success": false,
  "error": {
    "code": "QUERY_ERROR",
    "message": "syntax error at or near \"FORM\""
  }
}
```

---

## Common Patterns

### Pattern 1: Test and Execute

```bash
# 1. Test connection
curl -X POST http://localhost:8080/api/v1/data-sources/connections/conn-123/test

# 2. Get schema
curl http://localhost:8080/api/v1/data-sources/connections/conn-123/schema

# 3. Create query
QUERY_ID=$(curl -X POST ... | jq -r '.data.id')

# 4. Preview results
curl -X POST http://localhost:8080/api/v1/data-sources/queries/$QUERY_ID/preview \
  -d '{"limit": 5}'

# 5. Execute full query
curl -X POST http://localhost:8080/api/v1/data-sources/queries/$QUERY_ID/execute
```

### Pattern 2: Multiple Connections

```bash
# List all connections
CONNECTIONS=$(curl http://localhost:8080/api/v1/data-sources/connections | jq '.data')

# For each connection, test it
echo "$CONNECTIONS" | jq -r '.[].id' | while read conn_id; do
  echo "Testing $conn_id..."
  curl -X POST "http://localhost:8080/api/v1/data-sources/connections/$conn_id/test"
done
```

### Pattern 3: Export Query Results to CSV

```bash
# Execute query and convert to CSV
curl -X POST http://localhost:8080/api/v1/data-sources/queries/query-123/execute \
  -H "Content-Type: application/json" \
  -d '{"parameters": {...}}' | \
  jq -r '.data | (.[0] | keys | @csv), (.[] | @csv)' > output.csv
```

---

## Rate Limiting & Performance

**Recommended Limits**:
- Max 100 connections per environment
- Max 1000 queries per connection
- Max 10 concurrent executions
- Max 1,000,000 rows per query
- Cache duration: 1-3600 seconds

**Performance Tips**:
1. Use connection pooling (default 10, max 100)
2. Enable query caching for frequently used queries
3. Use pagination for large result sets
4. Create indexes on commonly filtered columns
5. Test connections regularly
6. Monitor execution times

---

*For more details, see PHASE-3-PART-3-DATA-INTEGRATION.md*
