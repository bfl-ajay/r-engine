# Rendering Engine API Reference

## Quick Start

### 1. Preview a Report
```bash
curl -X POST http://localhost:8080/api/v1/rendering/preview \
  -H "Content-Type: application/json" \
  -d '{
    "reportDefinition": {
      "name": "Sales Report",
      "bands": [
        {
          "id": "band-1",
          "type": "DATA",
          "height": 40,
          "visible": true,
          "children": [
            {
              "id": "obj-1",
              "type": "FIELD",
              "fieldName": "name",
              "position": { "x": 10, "y": 10 },
              "size": { "width": 100, "height": 20 }
            }
          ]
        }
      ],
      "pageSetup": { "paperSize": "A4", "orientation": "PORTRAIT" }
    },
    "data": [
      { "name": "John Doe", "amount": 1000 },
      { "name": "Jane Smith", "amount": 2000 }
    ],
    "format": "HTML"
  }'
```

### 2. Execute a Report
```bash
curl -X POST http://localhost:8080/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "report-123",
    "parameters": {
      "startDate": "2026-01-01",
      "endDate": "2026-12-31"
    }
  }'
```

### 3. Get Execution Status
```bash
curl http://localhost:8080/api/v1/executions/exec-456
```

### 4. Get Rendering Statistics
```bash
curl http://localhost:8080/api/v1/rendering/report-123/stats
```

---

## Rendering Endpoints

### POST /api/v1/rendering/preview

Preview a report with sample data (no need to save report first).

**Request Body**:
```json
{
  "reportDefinition": { /* ReportDefinition object */ },
  "data": [ /* array of data rows */ ],
  "format": "HTML",
  "parameters": { /* optional parameters */ }
}
```

**Response**:
- `format: HTML` → Returns HTML document (Content-Type: text/html)
- `format: JSON` → Returns JSON object

**Status Codes**:
- `200` - Success
- `400` - Invalid request
- `500` - Rendering error

**Examples**:

```bash
# Preview with simple data
curl -X POST http://localhost:8080/api/v1/rendering/preview \
  -H "Content-Type: application/json" \
  -d '{
    "reportDefinition": {...},
    "data": [{"name": "John", "amount": 1000}]
  }' > report.html

# Export as JSON
curl -X POST http://localhost:8080/api/v1/rendering/preview \
  -H "Content-Type: application/json" \
  -d '{
    "reportDefinition": {...},
    "data": [...],
    "format": "JSON"
  }'
```

---

### POST /api/v1/rendering/:reportId

Render a saved report with data.

**Parameters**:
- `reportId` (path) - ID of saved report

**Request Body**:
```json
{
  "data": [ /* array of data rows */ ],
  "format": "HTML",
  "parameters": { /* optional */ }
}
```

**Response**:
- HTML document or JSON based on format

**Status Codes**:
- `200` - Success
- `404` - Report not found
- `400` - Invalid request

**Examples**:

```bash
# Render with data
curl -X POST http://localhost:8080/api/v1/rendering/report-123 \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"name": "John"}, {"name": "Jane"}]
  }' > report.html
```

---

### GET /api/v1/rendering/:reportId/stats

Get report rendering statistics.

**Parameters**:
- `reportId` (path) - ID of report

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "Sales Report",
    "version": "1.0.0",
    "bands": 5,
    "objects": 20,
    "dataSources": 1,
    "parameters": 2,
    "fields": 8,
    "referencedFields": ["name", "amount", "date"],
    "estimatedSize": {
      "pages": 20,
      "estimatedBytes": 1048576
    }
  }
}
```

**Status Codes**:
- `200` - Success
- `404` - Report not found

**Examples**:

```bash
# Get report stats
curl http://localhost:8080/api/v1/rendering/report-123/stats | jq .

# Pretty print
curl http://localhost:8080/api/v1/rendering/report-123/stats | \
  jq '.data | {bands, objects, fields, estimatedSize}'
```

---

### POST /api/v1/rendering/validate

Validate a report definition for rendering.

**Request Body**:
```json
{
  "reportDefinition": { /* ReportDefinition object */ }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report definition is valid for rendering"
}
```

**Status Codes**:
- `200` - Valid
- `400` - Invalid

---

## Execution Endpoints

### POST /api/v1/executions

Execute a report and create an execution instance.

**Request Body**:
```json
{
  "reportId": "report-123",
  "parameters": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "region": "APAC"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "exec-456",
    "reportId": "report-123",
    "reportVersion": "1.0.0",
    "status": "RUNNING",
    "parameters": { "startDate": "2026-01-01", ... },
    "startedAt": "2026-06-19T10:00:00Z"
  }
}
```

**Status Codes**:
- `201` - Created and started
- `400` - Invalid request
- `404` - Report not found

**Examples**:

```bash
# Execute with parameters
curl -X POST http://localhost:8080/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "report-123",
    "parameters": {"year": 2026}
  }'

# Execute without parameters
curl -X POST http://localhost:8080/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{"reportId": "report-123"}'
```

---

### GET /api/v1/executions/:executionId

Get execution status and metadata.

**Parameters**:
- `executionId` (path) - ID of execution instance

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "exec-456",
    "reportId": "report-123",
    "reportVersion": "1.0.0",
    "status": "COMPLETED",
    "parameters": { ... },
    "startedAt": "2026-06-19T10:00:00Z",
    "completedAt": "2026-06-19T10:00:30Z",
    "rowCount": 1000,
    "pageCount": 5
  }
}
```

**Status Codes**:
- `200` - Found
- `404` - Not found

**Examples**:

```bash
# Check status
curl http://localhost:8080/api/v1/executions/exec-456

# Poll for completion
while true; do
  STATUS=$(curl -s http://localhost:8080/api/v1/executions/exec-456 | jq -r '.data.status')
  if [[ "$STATUS" == "COMPLETED" ]]; then
    echo "Done!"
    break
  fi
  echo "Status: $STATUS"
  sleep 1
done
```

---

### GET /api/v1/executions/:executionId/result

Get execution result in specified format.

**Parameters**:
- `executionId` (path) - ID of execution instance
- `format` (query) - Output format: HTML, PDF, JSON, CSV, XML (default: JSON)

**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec-456",
    "status": "COMPLETED",
    "rowCount": 1000,
    "pageCount": 5,
    "format": "HTML"
  }
}
```

**Status Codes**:
- `200` - Success
- `404` - Not found
- `400` - Execution not completed

**Examples**:

```bash
# Get as HTML
curl "http://localhost:8080/api/v1/executions/exec-456/result?format=HTML" > result.html

# Get as CSV
curl "http://localhost:8080/api/v1/executions/exec-456/result?format=CSV" > result.csv

# Get as JSON
curl "http://localhost:8080/api/v1/executions/exec-456/result?format=JSON" | jq .
```

---

### POST /api/v1/executions/:executionId/cancel

Cancel a running execution.

**Parameters**:
- `executionId` (path) - ID of execution instance

**Response**:
```json
{
  "success": true,
  "message": "Execution cancelled"
}
```

**Status Codes**:
- `200` - Cancelled
- `404` - Not found
- `400` - Cannot cancel (already finished)

**Examples**:

```bash
# Cancel execution
curl -X POST http://localhost:8080/api/v1/executions/exec-456/cancel
```

---

### DELETE /api/v1/executions/:executionId

Delete execution result and metadata.

**Parameters**:
- `executionId` (path) - ID of execution instance

**Response**:
```json
{
  "success": true,
  "message": "Execution deleted"
}
```

**Status Codes**:
- `200` - Deleted
- `404` - Not found

**Examples**:

```bash
# Delete execution
curl -X DELETE http://localhost:8080/api/v1/executions/exec-456
```

---

## Expression Syntax

### Field References
```
{fieldName}
{PARAMETER_NAME}
{PAGE_NUMBER}
{TOTAL_PAGES}
{ROW_NUMBER}
{DATE_TIME}
```

### Expressions
```
{=fieldName * 2}
{=amount > 1000}
{=date > parameter('startDate')}
{=IIF(status == 'Active', 'Premium', 'Standard')}
{=SUM(amount) / COUNT(*)}
```

### Format Strings
```
{amount:C2}              // Currency: $1,234.56
{value:N2}              // Number: 1,234.56
{percentage:P2}         // Percentage: 12.34%
{date:D}                // Long date: Wednesday, June 19, 2026
{date:d}                // Short date: 6/19/2026
{date:G}                // Full datetime: 6/19/2026 10:00:00 AM
{date:t}                // Short time: 10:00 AM
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "reportId is required",
    "details": {}
  }
}
```

### Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Report not found"
  }
}
```

### Rendering Error
```json
{
  "success": false,
  "error": {
    "code": "RENDERING_ERROR",
    "message": "Expression evaluation failed",
    "details": {
      "expression": "{=invalid syntax}",
      "reason": "Unexpected token"
    }
  }
}
```

---

## Common Patterns

### Pattern 1: Preview → Execute → Download

```bash
# 1. Preview report
curl -X POST http://localhost:8080/api/v1/rendering/preview \
  -H "Content-Type: application/json" \
  -d '{"reportDefinition": {...}, "data": [...]}'

# 2. If satisfied, execute full report
EXEC_ID=$(curl -X POST http://localhost:8080/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{"reportId": "report-123"}' | jq -r '.data.id')

# 3. Wait for completion
while [[ $(curl -s http://localhost:8080/api/v1/executions/$EXEC_ID | jq -r '.data.status') != "COMPLETED" ]]; do
  sleep 1
done

# 4. Download result
curl "http://localhost:8080/api/v1/executions/$EXEC_ID/result?format=PDF" > report.pdf
```

### Pattern 2: Check Report Statistics Before Execution

```bash
# Get stats
STATS=$(curl http://localhost:8080/api/v1/rendering/report-123/stats)

# Check if reasonable size
PAGES=$(echo $STATS | jq '.data.estimatedSize.pages')
echo "Estimated pages: $PAGES"

if [[ $PAGES -lt 100 ]]; then
  # Execute
  curl -X POST http://localhost:8080/api/v1/executions \
    -H "Content-Type: application/json" \
    -d '{"reportId": "report-123"}'
else
  echo "Report too large!"
fi
```

### Pattern 3: Export Multiple Formats

```bash
EXEC_ID="exec-456"

# Export as HTML
curl "http://localhost:8080/api/v1/executions/$EXEC_ID/result?format=HTML" > report.html

# Export as CSV
curl "http://localhost:8080/api/v1/executions/$EXEC_ID/result?format=CSV" > report.csv

# Export as JSON
curl "http://localhost:8080/api/v1/executions/$EXEC_ID/result?format=JSON" > report.json
```

---

## Rate Limiting & Performance

**Recommended Limits**:
- Max 10 concurrent executions per user
- Max 50MB request body
- Max 10 minute execution timeout
- Cache reports up to 1 hour

**Performance Tips**:
1. Use pagination for large datasets
2. Limit fields to only needed ones
3. Use indexes on data source
4. Cache report definitions
5. Monitor execution times

---

## Testing with Postman

### Collection Setup

```json
{
  "info": {
    "name": "Report Rendering API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Preview Report",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/v1/rendering/preview",
        "body": {
          "mode": "raw",
          "raw": "..."
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080"
    }
  ]
}
```

---

## Webhooks & Notifications (Future)

```
POST /api/v1/executions/subscribe
{
  "webhookUrl": "https://myapp.com/webhook",
  "events": ["COMPLETED", "FAILED"]
}

// Server will POST to webhook when event occurs:
{
  "event": "COMPLETED",
  "executionId": "exec-456",
  "status": "COMPLETED",
  "timestamp": "2026-06-19T10:00:30Z"
}
```

---

## Troubleshooting

### "Expression evaluation failed"
- Check syntax: `{=expression}`
- Ensure field names exist in data
- Check for undefined variables

### "Field not found in context"
- Verify field name matches data
- Check case sensitivity
- Look for typos

### "Report renders empty"
- Check band visibility
- Verify data rows exist
- Check field bindings

### Slow rendering
- Reduce number of fields
- Use pagination
- Optimize expressions
- Check data size

---

*For more details, see PHASE-3-PART-2-RENDERING.md*
