/**
 * Report Engine - Core Type Definitions
 * Shared types for frontend and backend
 */

// ============================================================================
// BAND TYPES & DEFINITIONS
// ============================================================================

export type BandType = 
  | 'TITLE'          // Title band (appears once at start)
  | 'HEADER'         // Page header (appears on every page)
  | 'DATA'           // Data band (repeats for each row)
  | 'GROUP_HEADER'   // Group header (appears before each group)
  | 'GROUP_FOOTER'   // Group footer (appears after each group)
  | 'DETAIL'         // Detail band (for nested/child reports)
  | 'FOOTER'         // Page footer (appears on every page)
  | 'REPORT_FOOTER'  // Report footer (appears once at end)
  | 'OVERLAY'        // Overlay band (appears on top of other bands)
  | 'CHILD'          // Child band (for subreports)
  | 'GROUP_OVERLAY'  // Group overlay band
  | 'REPORT_HEADER'  // Report header (appears once at start)
  | 'REPORT_SUMMARY';// Report summary band

export interface Band {
  id: string;
  type: BandType;
  name: string;
  description?: string;
  displayName?: string;
  height: number; // in pixels
  visible: boolean;
  dataSource?: string; // Data field or expression
  sort?: SortDefinition[];
  grouping?: GroupDefinition[];
  children: ReportObject[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
}

export interface SortDefinition {
  field: string;
  ascending: boolean;
}

export interface GroupDefinition {
  field: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// REPORT OBJECT TYPES
// ============================================================================

export type ReportObjectType =
  | 'TEXT'           // Static text or text field
  | 'LABEL'          // Text label
  | 'FIELD'          // Data field binding
  | 'EXPRESSION'     // Expression evaluation
  | 'IMAGE'          // Image or picture
  | 'SHAPE'          // Shape (rectangle, circle, etc.)
  | 'LINE'           // Line drawing
  | 'TABLE'          // Data table
  | 'MATRIX'         // Cross-tab matrix
  | 'CHART'          // Chart/graph
  | 'BARCODE'        // Barcode
  | 'QRCODE'         // QR code
  | 'SUBREPORT'      // Embedded subreport
  | 'PAGE_NUMBER'    // Page number field
  | 'TOTAL_PAGES'    // Total pages field
  | 'DATE_TIME';     // Date/time field

export interface Position {
  x: number;  // in pixels
  y: number;  // in pixels
}

export interface Size {
  width: number;   // in pixels
  height: number;  // in pixels
}

export interface Style {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  padding?: number;
  margin?: number;
  opacity?: number;
  zIndex?: number;
  rotate?: number; // in degrees
}

export interface TextStyle extends Style {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ReportObject {
  id: string;
  bandId: string;
  type: ReportObjectType;
  name: string;
  displayName?: string;
  description?: string;
  position: Position;
  size: Size;
  visible: boolean;
  locked?: boolean;
  style: Style;
  
  // Field-specific properties
  fieldName?: string;         // For FIELD type
  defaultValue?: string;      // Default value if field is empty
  format?: string;            // Format string (e.g., "{0:C}" for currency)
  expression?: string;        // For EXPRESSION type
  
  // Text-specific properties
  text?: string;              // Static text content
  textStyle?: TextStyle;      // Text styling
  wordWrap?: boolean;
  
  // Image-specific properties
  imageSource?: string;       // URL or embedded image data
  imageType?: 'URL' | 'BASE64' | 'RESOURCE';
  imageFit?: 'FILL' | 'PROPORTIONAL' | 'CLIP';
  
  // Table-specific properties
  columns?: TableColumn[];
  dataSource?: string;        // Data field for table data
  
  // Matrix-specific properties
  rowFields?: string[];
  columnFields?: string[];
  dataFields?: MatrixDataField[];
  
  // Chart-specific properties
  chartType?: 'BAR' | 'LINE' | 'PIE' | 'AREA' | 'SCATTER';
  chartData?: any;
  
  // Barcode-specific properties
  barcodeType?: string;       // CODE128, EAN, UPC, QR, etc.
  barcodeValue?: string;      // Value to encode
  
  // Subreport-specific properties
  subreportId?: string;       // Reference to another report
  
  // Other properties
  tooltip?: string;
  drillDownTarget?: string;   // Report to drill-down to
  hyperlink?: string;         // URL or expression for hyperlink
}

export interface TableColumn {
  id: string;
  name: string;
  fieldName: string;
  width?: number;
  headerText?: string;
  style?: TextStyle;
  headerStyle?: TextStyle;
  format?: string;
}

export interface MatrixDataField {
  name: string;
  fieldName: string;
  aggregation?: 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX';
}

// ============================================================================
// REPORT DEFINITION
// ============================================================================

export type ReportStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PaperSize = 'A4' | 'LETTER' | 'LEGAL' | 'TABLOID' | 'CUSTOM';
export type PageOrientation = 'PORTRAIT' | 'LANDSCAPE';

export interface PageSetup {
  paperSize: PaperSize;
  orientation: PageOrientation;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  width?: number;        // for CUSTOM paper size
  height?: number;       // for CUSTOM paper size
  columns?: number;      // for multi-column reports
  columnSpacing?: number;
}

export interface ReportParameter {
  id: string;
  name: string;
  displayName?: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT';
  defaultValue?: any;
  allowNull?: boolean;
  required?: boolean;
  multiValue?: boolean;   // Allow multiple values
  expression?: string;    // For dynamic defaults
}

export interface DataSourceBinding {
  id: string;
  name: string;
  type: 'SQL' | 'MONGODB' | 'API' | 'CSV' | 'JSON' | 'XML';
  connectionId: string;
  query: string;
  parameters?: Record<string, string>;
  caching?: {
    enabled: boolean;
    duration?: number;  // in seconds
  };
}

// ============================================================================
// DATA SOURCE MANAGEMENT
// ============================================================================

export type DataSourceType = 'SQL' | 'MONGODB' | 'API' | 'CSV' | 'JSON' | 'XML' | 'EXCEL';
export type DatabaseType = 'POSTGRESQL' | 'MYSQL' | 'MSSQL' | 'ORACLE';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface DataSourceConnection {
  id: string;
  name: string;
  displayName?: string;
  type: DataSourceType;
  description?: string;
  
  // Connection metadata
  isActive: boolean;
  isShared?: boolean;
  owner?: string;
  createdAt?: string;
  modifiedAt?: string;
  
  // SQL specific
  databaseType?: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;  // Should be encrypted
  ssl?: boolean;
  schema?: string;
  
  // MongoDB specific
  connectionString?: string;
  mongoDatabase?: string;
  
  // API specific
  baseUrl?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'NONE' | 'BASIC' | 'BEARER' | 'OAUTH';
    username?: string;
    password?: string;
    token?: string;
  };
  
  // File specific (CSV/JSON/Excel)
  filePath?: string;
  fileUrl?: string;
  hasHeaders?: boolean;
  encoding?: string;
  
  // Connection pool settings
  poolSize?: number;
  timeout?: number;  // in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
}

export interface QueryParameter {
  id: string;
  name: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  direction: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: any;
  required?: boolean;
}

export interface QueryDefinition {
  id: string;
  name: string;
  displayName?: string;
  connectionId: string;
  queryType: 'SQL' | 'MONGODB' | 'GRAPHQL' | 'REST';
  queryText: string;  // SQL, GraphQL, REST path, etc.
  parameters?: QueryParameter[];
  timeout?: number;
  caching?: {
    enabled: boolean;
    duration?: number;  // in seconds
    keyExpression?: string;  // Cache key formula
  };
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    skipParameter?: string;
    limitParameter?: string;
  };
}

export interface QueryResult {
  success: boolean;
  data?: any[];  // Array of result rows
  columns?: ColumnMetadata[];
  rowCount?: number;
  executionTime?: number;  // in milliseconds
  error?: {
    code: string;
    message: string;
  };
}

export interface ColumnMetadata {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  size?: number;
  nullable?: boolean;
}

export interface DataSourceSchema {
  connectionId: string;
  tables?: TableSchema[];
  collections?: CollectionSchema[];
  endpoints?: ApiEndpoint[];
}

export interface TableSchema {
  name: string;
  description?: string;
  columns: ColumnMetadata[];
  primaryKey?: string[];
  indexes?: IndexInfo[];
}

export interface CollectionSchema {
  name: string;
  fields: ColumnMetadata[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  description?: string;
  parameters?: {
    query?: Record<string, string>;
    body?: Record<string, any>;
  };
  response?: Record<string, any>;
}

export interface DataSourceTestResult {
  success: boolean;
  message: string;
  rowCount?: number;
  executionTime?: number;
  error?: string;
}

export interface JoinDefinition {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  leftTable: string;
  rightTable: string;
  condition: string;  // e.g., "users.id = orders.user_id"
}

export interface AggregationDefinition {
  field: string;
  function: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';
  alias?: string;
}

export interface FilterDefinition {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'LIKE' | 'BETWEEN' | 'IS_NULL';
  value?: any;
  values?: any[];  // For IN operator
  logic?: 'AND' | 'OR';
}

export interface SortDefinitionEx {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface AdvancedQueryBuilder {
  select: string[];
  from: string;
  joins?: JoinDefinition[];
  where?: FilterDefinition[];
  groupBy?: string[];
  having?: FilterDefinition[];
  orderBy?: SortDefinitionEx[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// ADVANCED REPORTING FEATURES (PHASE 3 PART 4)
// ============================================================================

export interface GroupingConfiguration {
  enabled: boolean;
  groupingFields: GroupField[];
  subtotals?: SubtotalDefinition[];
  showGroupHeader?: boolean;
  showGroupFooter?: boolean;
  groupHeaderStyle?: TextStyle;
  groupFooterStyle?: TextStyle;
}

export interface GroupField {
  field: string;
  name?: string;
  sortOrder: 'ASC' | 'DESC';
  breakOnChange?: boolean;    // Page break when value changes
  keepTogether?: boolean;     // Keep group on same page
  hideDetails?: boolean;      // Collapsible group
}

export interface SubtotalDefinition {
  id: string;
  name: string;
  field: string;              // Field to aggregate
  function: 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX' | 'STDDEV' | 'VARIANCE';
  groupLevel?: number;        // For nested grouping (0=report, 1=first group, etc.)
  placement: 'HEADER' | 'FOOTER' | 'BOTH';
  format?: string;
  style?: TextStyle;
}

export interface RunningTotalDefinition {
  id: string;
  name: string;
  field: string;
  expression?: string;        // Alternative to field
  scope: 'REPORT' | 'GROUP' | 'PAGE';
  format?: string;
  style?: TextStyle;
}

export interface CustomFunction {
  id: string;
  name: string;
  description?: string;
  parameters: FunctionParameter[];
  returnType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT';
  body: string;               // JavaScript function body
  isBuiltIn?: boolean;
  category?: 'MATH' | 'STRING' | 'DATE' | 'LOGIC' | 'CUSTOM';
  example?: string;
}

export interface FunctionParameter {
  name: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ARRAY';
  required?: boolean;
  defaultValue?: any;
}

export interface AdvancedFilteringConfiguration {
  enabled: boolean;
  allowUserFiltering?: boolean;
  defaultFilters?: FilterDefinition[];
  savedFilters?: SavedFilter[];
  filterLayout?: 'HORIZONTAL' | 'VERTICAL' | 'POPUP';
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterDefinition[];
  isPublic?: boolean;
}

export interface AdvancedSortingConfiguration {
  enabled: boolean;
  allowUserSorting?: boolean;
  defaultSort?: SortDefinitionEx[];
  multiLevelSort?: boolean;
  sortFields?: SortFieldConfiguration[];
}

export interface SortFieldConfiguration {
  field: string;
  allowSort?: boolean;
  direction?: 'ASC' | 'DESC';
  customComparator?: string;  // JavaScript function for custom sorting
}

export interface ReportDefinition {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  version: string;
  status: ReportStatus;
  
  // Design properties
  pageSetup: PageSetup;
  bands: Band[];
  dataSources: DataSourceBinding[];
  parameters: ReportParameter[];
  
  // Advanced features (Part 4)
  grouping?: GroupingConfiguration;
  filtering?: AdvancedFilteringConfiguration;
  sorting?: AdvancedSortingConfiguration;
  customFunctions?: CustomFunction[];
  runningTotals?: RunningTotalDefinition[];
  
  // Styling
  backgroundColor?: string;
  defaultStyle?: TextStyle;
  
  // Execution properties
  pageNumberStartAt?: number;
  rowsPerPage?: number;
  maxRowCount?: number;        // Prevent runaway reports
  timeoutSeconds?: number;     // Query timeout
  
  // Metadata
  author?: string;
  tags?: string[];
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  
  // Sharing & permissions
  isPublic?: boolean;
  shareWith?: string[];        // User/group IDs
}

// ============================================================================
// REPORT EXECUTION & RENDERING
// ============================================================================

export type ExecutionStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ExportFormat = 
  | 'PDF'
  | 'EXCEL'
  | 'CSV'
  | 'HTML'
  | 'WORD'
  | 'JSON'
  | 'XML';

export interface ReportInstance {
  id: string;
  reportId: string;
  reportVersion: string;
  status: ExecutionStatus;
  parameters: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  rowCount?: number;
  pageCount?: number;
  fileName?: string;
}

export interface ExportJob {
  id: string;
  instanceId: string;
  format: ExportFormat;
  status: ExecutionStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: string;
  completedAt?: string;
}

// ============================================================================
// DESIGNER STATE & OPERATIONS
// ============================================================================

export interface DesignerState {
  report: ReportDefinition;
  selectedBandId?: string;
  selectedObjectId?: string;
  selectedGroupingField?: string;
  zoom: number;              // 50 - 200 (percentage)
  showGrid: boolean;
  gridSize: number;          // pixels
  snapToGrid: boolean;
  isDirty: boolean;          // Has unsaved changes
  history: DesignerHistoryState[];   // Undo history
  historyIndex: number;      // Current position in history
  showRulers?: boolean;
  showSnapGuides?: boolean;
  preferences?: DesignerPreferences;
}

export interface DesignerHistoryState {
  report: ReportDefinition;
  timestamp: number;
  description?: string;
}

export interface DesignerPreferences {
  gridSize?: number;
  snapToGrid?: boolean;
  showRulers?: boolean;
  showSnapGuides?: boolean;
  defaultFontFamily?: string;
  defaultFontSize?: number;
  autosaveInterval?: number;  // in milliseconds
  undoStackSize?: number;
  alignmentGuideColor?: string;
}

export interface BandEditorState {
  bandId: string;
  editingProperties: boolean;
  expandedGroups?: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
