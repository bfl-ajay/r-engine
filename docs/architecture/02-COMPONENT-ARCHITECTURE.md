# Component Architecture - Reporting Engine

**Document Version:** 1.0  
**Date:** 2026-06-19  
**Status:** Final

---

## 1. Component Overview

The reporting engine consists of interconnected components organized into distinct layers. This document defines the detailed component architecture, interfaces, and relationships.

---

## 2. Frontend Components Architecture

### 2.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserMenu
│   │   └── Notifications
│   ├── Sidebar
│   │   ├── MainMenu
│   │   └── ContextMenu
│   └── Footer
├── Pages
│   ├── Dashboard
│   ├── ReportDesigner
│   │   ├── Canvas
│   │   ├── PropertiesPanel
│   │   ├── ObjectPalette
│   │   └── Toolbar
│   ├── ReportViewer
│   │   ├── Toolbar
│   │   ├── ViewerCanvas
│   │   └── ExportDialog
│   ├── TemplateManager
│   ├── DataSourceManager
│   └── Administration
└── Modals & Dialogs
```

### 2.2 Report Designer Components

#### ReportDesigner (Container)
- Main designer page
- Manages design state and interactions
- Coordinates between sub-components

**Props:**
```typescript
interface ReportDesignerProps {
  reportId?: string;
  templateId?: string;
  onSave: (report: ReportDefinition) => Promise<void>;
  onPublish: (report: ReportDefinition) => Promise<void>;
}
```

#### Canvas (Canvas Area)
- Visual representation of report bands
- Drag-and-drop for report objects
- Band resizing and reorganization
- Multi-selection support

**Props:**
```typescript
interface CanvasProps {
  report: ReportDefinition;
  selectedObjects: ReportObject[];
  onObjectSelect: (objects: ReportObject[]) => void;
  onObjectMove: (objectId: string, x: number, y: number) => void;
  onObjectResize: (objectId: string, width: number, height: number) => void;
}
```

#### ObjectPalette (Component Library)
- Draggable report objects
- Categorized by type
- Search and filtering
- Drag-to-canvas functionality

**Components Available:**
- Text
- Image
- Line/Shape
- Table
- Matrix
- Barcode
- Chart
- Custom Objects

#### PropertiesPanel (Inspector)
- Property editing for selected objects
- Style customization
- Data binding
- Expression editor

**Props:**
```typescript
interface PropertiesPanel {
  selectedObject: ReportObject | null;
  onPropertyChange: (property: string, value: any) => void;
  onExpressionEdit: (property: string) => void;
}
```

#### Toolbar
- Save, Preview, Publish actions
- Undo/Redo controls
- View options (zoom, grid, rulers)
- Layout management

### 2.3 Report Viewer Components

#### ReportViewer (Container)
- Display rendered reports
- Navigate through pages
- Export options
- Parameter input

**Props:**
```typescript
interface ReportViewerProps {
  reportDefinitionId: string;
  reportInstanceId?: string;
  parameters?: Record<string, any>;
  onExport?: (format: ExportFormat) => void;
}
```

#### ViewerCanvas
- Display formatted report output
- Print-ready layout
- Page navigation
- Zoom controls

#### ExportDialog
- Select export format
- Configure export options
- Generate and download file

### 2.4 Template Manager Components

#### TemplateList
- List all report templates
- Search and filtering
- Sorting options
- Bulk operations

#### TemplateEditor
- Edit template metadata
- Define inheritance
- Set default values

#### VersionControl
- Template version history
- Rollback functionality
- Version comparison

### 2.5 Data Source Manager Components

#### DataSourceList
- List all configured data sources
- Connection status
- Test connection
- CRUD operations

#### DataSourceForm
- Configure connection parameters
- Test before saving
- Credential management

#### QueryBuilder
- Visual query builder
- SQL editor
- Query testing
- Parameter mapping

### 2.6 Shared Components

#### BandDesigner
- Edit band properties
- Configure band visibility
- Manage band height
- Conditional visibility expressions

#### ExpressionEditor
- Syntax highlighting
- Function autocomplete
- Real-time validation
- Expression testing

#### DataBinding
- Select data fields
- Configure aggregations
- Map parameters
- Define expressions

#### StyleEditor
- Font properties
- Colors and fills
- Borders and padding
- Alignment options

---

## 3. Backend Service Components

### 3.1 Report Design Service

```
ReportDesignService/
├── ReportController
├── ReportService
│   ├── ReportCreationService
│   ├── ReportModificationService
│   └── ReportValidationService
├── BandService
├── ReportObjectService
├── Models
│   ├── Report
│   ├── Band
│   ├── ReportObject
│   └── ReportDefinition
└── Repositories
    ├── ReportRepository
    ├── BandRepository
    └── ReportObjectRepository
```

**Key Responsibilities:**
- Create/read/update/delete report definitions
- Validate report structure
- Manage band configuration
- Handle report objects (CRUD)
- Support report inheritance

**Interfaces:**

```typescript
interface IReportDesignService {
  createReport(definition: ReportDefinition): Promise<Report>;
  getReport(reportId: string): Promise<Report>;
  updateReport(reportId: string, definition: ReportDefinition): Promise<Report>;
  deleteReport(reportId: string): Promise<void>;
  validateReport(definition: ReportDefinition): Promise<ValidationResult>;
  publishReport(reportId: string): Promise<void>;
}

interface IReportObjectService {
  addObject(reportId: string, bandId: string, object: ReportObject): Promise<ReportObject>;
  updateObject(objectId: string, object: ReportObject): Promise<ReportObject>;
  deleteObject(objectId: string): Promise<void>;
  moveObject(objectId: string, x: number, y: number): Promise<void>;
  resizeObject(objectId: string, width: number, height: number): Promise<void>;
}
```

### 3.2 Report Execution Service

```
ReportExecutionService/
├── ExecutionController
├── ExecutionService
│   ├── RenderingEngine
│   ├── PaginationService
│   ├── StreamingService
│   └── CacheService
├── Models
│   ├── ReportInstance
│   └── ExecutionContext
└── Repositories
    └── ExecutionRepository
```

**Key Responsibilities:**
- Execute reports with parameters
- Manage execution context
- Handle data transformation
- Implement pagination
- Cache results
- Stream large datasets

**Interfaces:**

```typescript
interface IReportExecutionService {
  executeReport(
    reportDefinitionId: string,
    parameters: Record<string, any>,
    options?: ExecutionOptions
  ): Promise<ReportInstance>;
  
  getReportInstance(instanceId: string): Promise<ReportInstance>;
  
  cancelExecution(instanceId: string): Promise<void>;
  
  getPageData(instanceId: string, pageNumber: number): Promise<PageData>;
  
  streamReport(instanceId: string): AsyncIterator<PageData>;
}

interface IRenderingEngine {
  renderReport(
    definition: ReportDefinition,
    data: ExecutionData,
    context: ExecutionContext
  ): Promise<RenderedReport>;
  
  renderBand(band: Band, data: any[]): Promise<RenderedBand>;
  
  renderObject(object: ReportObject, data: any): Promise<RenderedObject>;
}
```

### 3.3 Template Management Service

```
TemplateManagementService/
├── TemplateController
├── TemplateService
│   ├── VersioningService
│   ├── InheritanceService
│   └── ApprovalService
├── Models
│   ├── ReportTemplate
│   └── TemplateVersion
└── Repositories
    └── TemplateRepository
```

**Key Responsibilities:**
- Create/update/delete templates
- Version control
- Template inheritance
- Approval workflow
- Template cloning

**Interfaces:**

```typescript
interface ITemplateManagementService {
  createTemplate(template: ReportTemplate): Promise<ReportTemplate>;
  getTemplate(templateId: string, version?: string): Promise<ReportTemplate>;
  updateTemplate(templateId: string, template: ReportTemplate): Promise<ReportTemplate>;
  deleteTemplate(templateId: string): Promise<void>;
  getTemplateVersions(templateId: string): Promise<TemplateVersion[]>;
  rollbackVersion(templateId: string, versionId: string): Promise<void>;
  cloneTemplate(templateId: string, newName: string): Promise<ReportTemplate>;
}

interface IInheritanceService {
  setBaseTemplate(templateId: string, baseTemplateId: string): Promise<void>;
  getInheritedElements(templateId: string): Promise<ReportElement[]>;
  overrideElement(templateId: string, elementId: string, override: any): Promise<void>;
}
```

### 3.4 Data Integration Service

```
DataIntegrationService/
├── IntegrationController
├── DataSourceService
│   ├── ConnectionManager
│   ├── QueryExecutor
│   └── CacheLayer
├── Connectors
│   ├── SqlServerConnector
│   ├── MySqlConnector
│   ├── OracleConnector
│   ├── PostgreSqlConnector
│   ├── MongoDbConnector
│   ├── CsvConnector
│   ├── XmlConnector
│   └── JsonConnector
├── Models
│   └── DataSource
└── Repositories
    └── DataSourceRepository
```

**Key Responsibilities:**
- Manage data source connections
- Execute queries against sources
- Transform data
- Cache query results
- Handle pagination

**Interfaces:**

```typescript
interface IDataSourceService {
  createDataSource(dataSource: DataSource): Promise<DataSource>;
  testConnection(dataSourceId: string): Promise<boolean>;
  executeQuery(dataSourceId: string, query: string, parameters?: any[]): Promise<QueryResult>;
  getQueryPreview(dataSourceId: string, query: string, limit?: number): Promise<any[]>;
}

interface IConnector {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(query: string, parameters?: any[]): Promise<QueryResult>;
  getTableSchema(tableName: string): Promise<ColumnInfo[]>;
  getTableList(): Promise<string[]>;
}
```

### 3.5 Script Engine Service

```
ScriptEngineService/
├── ScriptController
├── ScriptExecutionService
│   ├── Compiler
│   ├── Runtime
│   └── FunctionLibrary
├── Models
│   └── Script
└── Repositories
    └── ScriptRepository
```

**Key Responsibilities:**
- Compile scripts
- Execute expressions
- Manage custom functions
- Handle errors and validation
- Provide runtime context

**Interfaces:**

```typescript
interface IScriptExecutionService {
  compileScript(script: string): Promise<CompiledScript>;
  executeScript(
    compiledScript: CompiledScript,
    context: ExecutionContext
  ): Promise<any>;
  evaluateExpression(expression: string, context: any): Promise<any>;
  registerFunction(name: string, func: Function): void;
}

interface IFunctionLibrary {
  sum(values: number[]): number;
  avg(values: number[]): number;
  count(values: any[]): number;
  min(values: number[]): number;
  max(values: number[]): number;
  formatDate(date: Date, format: string): string;
  formatCurrency(value: number, currency: string): string;
  // ... more functions
}
```

### 3.6 Export Service

```
ExportService/
├── ExportController
├── ExportService
│   ├── FormatRegistry
│   └── ExportQueue
├── Renderers
│   ├── PdfRenderer
│   ├── ExcelRenderer
│   ├── WordRenderer
│   └── HtmlRenderer
├── Models
│   └── ExportJob
└── Repositories
    └── ExportRepository
```

**Key Responsibilities:**
- Manage export formats
- Generate documents
- Handle streaming exports
- Store export history

**Interfaces:**

```typescript
interface IExportService {
  exportReport(
    reportInstanceId: string,
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<ExportJob>;
  
  getExportStatus(jobId: string): Promise<ExportStatus>;
  
  downloadExport(jobId: string): Promise<Buffer>;
}

interface IRenderer {
  render(report: RenderedReport, options: ExportOptions): Promise<Buffer>;
  
  supportsStreaming(): boolean;
  
  streamRender(report: RenderedReport, options: ExportOptions): AsyncIterator<Buffer>;
}
```

### 3.7 Authentication & Authorization Service

```
AuthService/
├── AuthController
├── AuthenticationService
│   ├── TokenManager
│   ├── OAuthProvider
│   └── SamlProvider
├── AuthorizationService
│   ├── RbacEngine
│   └── PermissionEvaluator
├── Models
│   ├── User
│   ├── Role
│   └── Permission
└── Repositories
    ├── UserRepository
    ├── RoleRepository
    └── PermissionRepository
```

**Key Responsibilities:**
- User authentication
- Token management
- Role and permission management
- Authorization checks
- Multi-tenancy support

**Interfaces:**

```typescript
interface IAuthenticationService {
  authenticate(credentials: Credentials): Promise<AuthToken>;
  validateToken(token: string): Promise<TokenPayload>;
  refreshToken(refreshToken: string): Promise<AuthToken>;
  logout(token: string): Promise<void>;
}

interface IAuthorizationService {
  hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
  getRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  revokeRole(userId: string, roleId: string): Promise<void>;
  createRole(role: Role): Promise<Role>;
  assignPermission(roleId: string, permissionId: string): Promise<void>;
}
```

### 3.8 Administration Service

```
AdminService/
├── AdminController
├── UserManagementService
├── SystemConfigService
├── AuditService
├── Models
│   ├── AuditLog
│   └── SystemConfig
└── Repositories
    ├── AuditRepository
    └── ConfigRepository
```

**Key Responsibilities:**
- User CRUD operations
- System configuration
- Audit logging
- System health monitoring

---

## 4. Data Models & Entities

### 4.1 Report Definition Model

```typescript
interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  bands: Band[];
  dataSources: DataSourceBinding[];
  parameters: Parameter[];
  styles: StyleDefinition[];
  metadata: {
    createdAt: Date;
    createdBy: string;
    modifiedAt: Date;
    modifiedBy: string;
  };
}
```

### 4.2 Band Model

```typescript
interface Band {
  id: string;
  name: string;
  type: BandType;
  height: number;
  visible: boolean;
  visibilityExpression?: string;
  objects: ReportObject[];
  groupingFields?: string[];
  data?: any[];
}

enum BandType {
  REPORT_TITLE = 'report_title',
  REPORT_SUMMARY = 'report_summary',
  PAGE_HEADER = 'page_header',
  PAGE_FOOTER = 'page_footer',
  COLUMN_HEADER = 'column_header',
  COLUMN_FOOTER = 'column_footer',
  DATA_HEADER = 'data_header',
  DATA_BAND = 'data_band',
  DATA_FOOTER = 'data_footer',
  GROUP_HEADER = 'group_header',
  GROUP_FOOTER = 'group_footer',
  CHILD_BAND = 'child_band',
  OVERLAY_BAND = 'overlay_band'
}
```

### 4.3 Report Object Model

```typescript
interface ReportObject {
  id: string;
  name: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  properties: {
    [key: string]: any;
  };
  style?: StyleDefinition;
  dataBinding?: DataBinding;
}

enum ObjectType {
  TEXT = 'text',
  IMAGE = 'image',
  LINE = 'line',
  SHAPE = 'shape',
  BARCODE = 'barcode',
  TABLE = 'table',
  MATRIX = 'matrix',
  CHART = 'chart',
  CUSTOM = 'custom'
}
```

### 4.4 Data Source Model

```typescript
interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionString?: string;
  credentials?: EncryptedCredentials;
  config: {
    [key: string]: any;
  };
  status: 'active' | 'inactive' | 'error';
}

enum DataSourceType {
  SQL_SERVER = 'sql_server',
  MYSQL = 'mysql',
  ORACLE = 'oracle',
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb',
  CSV = 'csv',
  XML = 'xml',
  JSON = 'json',
  API = 'api'
}
```

### 4.5 Query Model

```typescript
interface Query {
  id: string;
  name: string;
  dataSourceId: string;
  queryText: string;
  type: 'sql' | 'mql' | 'rest';
  parameters: QueryParameter[];
  resultSet?: any[];
}

interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
}
```

---

## 5. Integration Points

### 5.1 API Contracts

All service-to-service communication follows REST API conventions:

```
GET    /api/{service}/...           - Retrieve resources
POST   /api/{service}/...           - Create resources
PUT    /api/{service}/{id}          - Update resources
PATCH  /api/{service}/{id}          - Partial update
DELETE /api/{service}/{id}          - Delete resources
```

### 5.2 Event Contracts

Events published to message queue:

```typescript
interface ReportEvent {
  eventId: string;
  eventType: ReportEventType;
  timestamp: Date;
  source: string;
  payload: any;
  tenantId?: string;
}

enum ReportEventType {
  REPORT_CREATED = 'report.created',
  REPORT_UPDATED = 'report.updated',
  REPORT_PUBLISHED = 'report.published',
  REPORT_EXECUTED = 'report.executed',
  EXPORT_COMPLETED = 'export.completed',
  AUDIT_LOG_CREATED = 'audit.log.created'
}
```

### 5.3 External Integration Points

- **OAuth Provider**: OAuth 2.0 token endpoint
- **SAML Provider**: SAML assertion endpoint
- **Email Service**: SMTP for notifications
- **Storage Service**: S3/Azure Blob for file storage
- **Monitoring**: Prometheus metrics endpoint

---

## 6. Component Deployment

### 6.1 Frontend Deployment
- Docker container with Node.js + nginx
- Static files served via CDN
- Environment-specific configuration

### 6.2 Backend Deployment
- Docker container per service
- Kubernetes deployment with autoscaling
- Horizontal pod autoscaling based on CPU/memory

### 6.3 Database Deployment
- PostgreSQL on Kubernetes StatefulSet
- Persistent volume for data
- Automated backups

---

**End of Document**
