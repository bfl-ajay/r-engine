# Database Design - Reporting Engine

**Document Version:** 1.0  
**Date:** 2026-06-19  
**Status:** Final

---

## 1. Database Overview

### 1.1 Primary Database
- **System**: PostgreSQL 15+
- **Purpose**: Core reporting engine data
- **Scaling**: Replication, partitioning for large tables

### 1.2 Database Design Principles
- Normalization (3NF) for consistency
- Denormalization for performance where appropriate
- Soft deletes for audit trail
- Partitioning for large time-series tables
- Proper indexing strategy

---

## 2. Entity Relationship Diagram

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password_hash       │
│ first_name          │
│ last_name           │
│ status              │
│ last_login          │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ (1:N)
           │
┌──────────▼──────────┐
│      roles          │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ description         │
│ created_at          │
└─────────────────────┘


┌─────────────────────┐     ┌──────────────────────┐
│ user_roles          │────▶│ permissions          │
├─────────────────────┤     ├──────────────────────┤
│ user_id (FK)        │     │ id (PK)              │
│ role_id (FK)        │     │ name                 │
│ assigned_at         │     │ resource             │
└─────────────────────┘     │ action               │
                            │ description          │
                            │ created_at           │
                            └──────────────────────┘


┌──────────────────────┐
│ role_permissions     │
├──────────────────────┤
│ role_id (FK)         │
│ permission_id (FK)   │
│ granted_at           │
└──────────────────────┘


┌──────────────────────────┐
│   reports                │
├──────────────────────────┤
│ id (PK)                  │
│ name                     │
│ description              │
│ template_id (FK)         │
│ created_by (FK->users)   │
│ modified_by (FK->users)  │
│ status                   │
│ version                  │
│ created_at               │
│ updated_at               │
│ deleted_at               │
└────────┬─────────────────┘
         │ (1:N)
         ▼
┌──────────────────────────┐
│   report_versions        │
├──────────────────────────┤
│ id (PK)                  │
│ report_id (FK)           │
│ version_number           │
│ definition               │
│ created_by (FK->users)   │
│ created_at               │
│ change_log               │
└──────────────────────────┘


┌──────────────────────────┐
│   report_templates       │
├──────────────────────────┤
│ id (PK)                  │
│ name                     │
│ description              │
│ base_template_id (FK)    │
│ created_by (FK->users)   │
│ status                   │
│ version                  │
│ created_at               │
│ updated_at               │
└────────┬─────────────────┘
         │ (1:N)
         ▼
┌──────────────────────────┐
│   template_elements      │
├──────────────────────────┤
│ id (PK)                  │
│ template_id (FK)         │
│ element_type             │
│ element_name             │
│ properties (JSON)        │
│ display_order            │
└──────────────────────────┘


┌──────────────────────────┐
│   data_sources           │
├──────────────────────────┤
│ id (PK)                  │
│ name                     │
│ type                     │
│ connection_string        │
│ config (encrypted JSON)  │
│ status                   │
│ created_by (FK->users)   │
│ created_at               │
│ updated_at               │
└────────┬─────────────────┘
         │ (1:N)
         ▼
┌──────────────────────────┐
│   data_source_queries    │
├──────────────────────────┤
│ id (PK)                  │
│ data_source_id (FK)      │
│ name                     │
│ query_text               │
│ query_type               │
│ cached_result            │
│ cache_expires_at         │
│ created_at               │
└──────────────────────────┘


┌──────────────────────────┐
│   report_instances       │
├──────────────────────────┤
│ id (PK)                  │
│ report_id (FK)           │
│ executed_by (FK->users)  │
│ status                   │
│ execution_start          │
│ execution_end            │
│ total_pages              │
│ total_records            │
│ error_message            │
│ execution_parameters     │
│ created_at               │
└────────┬─────────────────┘
         │ (1:N)
         ▼
┌──────────────────────────┐
│   report_pages           │
├──────────────────────────┤
│ id (PK)                  │
│ instance_id (FK)         │
│ page_number              │
│ content (compressed)     │
│ created_at               │
└──────────────────────────┘


┌──────────────────────────┐
│   export_jobs            │
├──────────────────────────┤
│ id (PK)                  │
│ report_instance_id (FK)  │
│ format                   │
│ status                   │
│ file_path                │
│ file_size                │
│ requested_by (FK->users) │
│ created_at               │
│ completed_at             │
└──────────────────────────┘


┌──────────────────────────┐
│   audit_logs             │
├──────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │
│ action                   │
│ resource_type            │
│ resource_id              │
│ change_summary           │
│ ip_address               │
│ timestamp                │
└──────────────────────────┘
```

---

## 3. Detailed Table Specifications

### 3.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'inactive', 'suspended'
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 3.2 Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
```

### 3.3 User Roles Table

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### 3.4 Permissions Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL, -- 'report', 'template', 'datasource', 'user'
  action VARCHAR(50) NOT NULL,   -- 'create', 'read', 'update', 'delete', 'execute'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(resource, action)
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
```

### 3.5 Role Permissions Table

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

### 3.6 Report Templates Table

```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  definition JSONB NOT NULL, -- Complete template structure
  thumbnail_path VARCHAR(512),
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  version VARCHAR(20) DEFAULT '1.0.0',
  created_by UUID NOT NULL REFERENCES users(id),
  modified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_templates_name ON report_templates(name);
CREATE INDEX idx_templates_status ON report_templates(status);
CREATE INDEX idx_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_templates_base_template_id ON report_templates(base_template_id);
```

### 3.7 Template Elements Table

```sql
CREATE TABLE template_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL, -- 'band', 'object', 'style'
  element_name VARCHAR(100),
  properties JSONB NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_elements_template_id ON template_elements(template_id);
CREATE INDEX idx_template_elements_element_type ON template_elements(element_type);
```

### 3.8 Reports Table

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  definition JSONB NOT NULL, -- Complete report definition
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  version VARCHAR(20) DEFAULT '1.0.0',
  created_by UUID NOT NULL REFERENCES users(id),
  modified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_reports_name ON reports(name);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

### 3.9 Report Versions Table

```sql
CREATE TABLE report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version_number VARCHAR(20) NOT NULL,
  definition JSONB NOT NULL,
  change_log TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(report_id, version_number)
);

CREATE INDEX idx_report_versions_report_id ON report_versions(report_id);
CREATE INDEX idx_report_versions_created_at ON report_versions(created_at DESC);
```

### 3.10 Data Sources Table

```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'sql_server', 'mysql', 'oracle', 'postgresql', 'mongodb', 'csv', 'xml', 'json'
  connection_config JSONB NOT NULL, -- Encrypted sensitive data
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'error'
  last_status_check TIMESTAMP,
  last_error TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_data_sources_name ON data_sources(name);
CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_data_sources_status ON data_sources(status);
CREATE INDEX idx_data_sources_created_by ON data_sources(created_by);
```

### 3.11 Data Source Queries Table

```sql
CREATE TABLE data_source_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_type VARCHAR(20) NOT NULL, -- 'sql', 'mql', 'rest'
  parameters JSONB, -- Query parameters definition
  result_cache JSONB,
  cache_expires_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_source_queries_data_source_id ON data_source_queries(data_source_id);
CREATE INDEX idx_data_source_queries_name ON data_source_queries(name);
```

### 3.12 Report Instances Table

```sql
CREATE TABLE report_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  executed_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  execution_start TIMESTAMP,
  execution_end TIMESTAMP,
  total_pages INTEGER,
  total_records INTEGER,
  error_message TEXT,
  execution_parameters JSONB,
  execution_context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_report_instances_report_id ON report_instances(report_id);
CREATE INDEX idx_report_instances_executed_by ON report_instances(executed_by);
CREATE INDEX idx_report_instances_status ON report_instances(status);
CREATE INDEX idx_report_instances_created_at ON report_instances(created_at DESC);
```

### 3.13 Report Pages Table

```sql
CREATE TABLE report_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES report_instances(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content BYTEA NOT NULL, -- Compressed rendered content
  content_type VARCHAR(50) DEFAULT 'html', -- 'html', 'json'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(instance_id, page_number)
);

CREATE INDEX idx_report_pages_instance_id ON report_pages(instance_id);
```

### 3.14 Export Jobs Table

```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_instance_id UUID NOT NULL REFERENCES report_instances(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL, -- 'pdf', 'excel', 'word', 'html', 'csv'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  file_path VARCHAR(512),
  file_size BIGINT,
  requested_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_export_jobs_report_instance_id ON export_jobs(report_instance_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);
```

### 3.15 Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'execute', 'export'
  resource_type VARCHAR(50) NOT NULL, -- 'report', 'template', 'datasource', 'user'
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  change_summary JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (timestamp);

-- Create partitions for faster queries
CREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE audit_logs_2026_q2 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 4. Indexing Strategy

### 4.1 Search Indexes
- Full-text search on report names, descriptions
- Case-insensitive name searches

```sql
CREATE INDEX idx_reports_name_gin ON reports USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
```

### 4.2 Performance Indexes
- Foreign key indexes for joins
- Status filters
- Time-range queries
- User-based filtering

### 4.3 JSONB Indexes
```sql
CREATE INDEX idx_reports_definition_gin ON reports USING GIN(definition);
CREATE INDEX idx_data_source_config_gin ON data_sources USING GIN(connection_config);
```

---

## 5. Constraints & Validations

### 5.1 Domain Constraints
```sql
-- Valid status values
ALTER TABLE reports ADD CONSTRAINT valid_report_status
  CHECK (status IN ('draft', 'published', 'archived'));

-- Valid data source types
ALTER TABLE data_sources ADD CONSTRAINT valid_datasource_type
  CHECK (type IN ('sql_server', 'mysql', 'oracle', 'postgresql', 'mongodb', 'csv', 'xml', 'json'));
```

### 5.2 Referential Integrity
- Foreign key constraints with appropriate CASCADE/SET NULL rules
- ON DELETE CASCADE for dependent records
- ON DELETE SET NULL for optional references

---

## 6. Performance Optimization

### 6.1 Partitioning Strategy
- **Audit logs**: Partitioned by month/quarter
- **Report instances**: Could be partitioned by date if necessary
- **Report pages**: Partitioned by report instance

### 6.2 Caching Strategy
- Cache frequently accessed templates in Redis
- Cache query results with TTL
- Invalidate cache on updates

### 6.3 Connection Pooling
- PgBouncer for PostgreSQL connection pooling
- Min pool: 5, Max pool: 100
- Connection timeout: 30 seconds

---

## 7. Backup & Recovery

### 7.1 Backup Strategy
- Daily full backups
- Hourly incremental backups
- Weekly backups retained for 1 month
- Monthly backups retained for 1 year
- Off-site storage

### 7.2 Recovery Procedures
- Point-in-time recovery (PITR) capability
- Full database restore
- Table-level restore
- Automated backup validation

---

## 8. Migration Scripts

### 8.1 Schema Versioning
```sql
CREATE TABLE schema_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 Migration Tools
- Liquibase for database migrations
- Version-controlled migration scripts
- Rollback capabilities

---

## 9. Security Measures

### 9.1 Encryption
- Sensitive data (passwords, credentials) encrypted at rest
- TLS for data in transit
- Column-level encryption for PII

### 9.2 Row-Level Security (RLS)
- PostgreSQL RLS policies for tenant isolation
- User can only access reports they created or have permission for

```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_reports_policy ON reports
  FOR SELECT USING (created_by = current_user_id OR has_permission('read', id));
```

### 9.3 Access Control
- Audit all data access
- No direct SQL access from applications
- Parameterized queries only
- Prepared statements

---

## 10. Monitoring & Maintenance

### 10.1 Database Health Checks
```sql
-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

### 10.2 Maintenance Tasks
- VACUUM and ANALYZE regularly
- Reindex fragmented indexes
- Monitor connection count
- Monitor disk space

---

**End of Document**
