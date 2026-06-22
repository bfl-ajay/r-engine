/**
 * Report Engine - Core Type Definitions
 * Shared types for frontend and backend
 */
export type BandType = 'TITLE' | 'HEADER' | 'DATA' | 'GROUP_HEADER' | 'GROUP_FOOTER' | 'DETAIL' | 'FOOTER' | 'REPORT_FOOTER' | 'OVERLAY' | 'CHILD' | 'GROUP_OVERLAY' | 'REPORT_HEADER' | 'REPORT_SUMMARY';
export interface Band {
    id: string;
    type: BandType;
    name: string;
    description?: string;
    displayName?: string;
    height: number;
    visible: boolean;
    dataSource?: string;
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
export type ReportObjectType = 'TEXT' | 'LABEL' | 'FIELD' | 'EXPRESSION' | 'IMAGE' | 'SHAPE' | 'LINE' | 'TABLE' | 'MATRIX' | 'CHART' | 'BARCODE' | 'QRCODE' | 'SUBREPORT' | 'PAGE_NUMBER' | 'TOTAL_PAGES' | 'DATE_TIME';
export interface Position {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
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
    rotate?: number;
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
    fieldName?: string;
    defaultValue?: string;
    format?: string;
    expression?: string;
    text?: string;
    textStyle?: TextStyle;
    wordWrap?: boolean;
    imageSource?: string;
    imageType?: 'URL' | 'BASE64' | 'RESOURCE';
    imageFit?: 'FILL' | 'PROPORTIONAL' | 'CLIP';
    columns?: TableColumn[];
    dataSource?: string;
    rowFields?: string[];
    columnFields?: string[];
    dataFields?: MatrixDataField[];
    chartType?: 'BAR' | 'LINE' | 'PIE' | 'AREA' | 'SCATTER';
    chartData?: any;
    barcodeType?: string;
    barcodeValue?: string;
    subreportId?: string;
    tooltip?: string;
    drillDownTarget?: string;
    hyperlink?: string;
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
    width?: number;
    height?: number;
    columns?: number;
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
    multiValue?: boolean;
    expression?: string;
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
        duration?: number;
    };
}
export type DataSourceType = 'SQL' | 'MONGODB' | 'API' | 'CSV' | 'JSON' | 'XML' | 'EXCEL';
export type DatabaseType = 'POSTGRESQL' | 'MYSQL' | 'MSSQL' | 'ORACLE';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface DataSourceConnection {
    id: string;
    name: string;
    displayName?: string;
    type: DataSourceType;
    description?: string;
    isActive: boolean;
    isShared?: boolean;
    owner?: string;
    createdAt?: string;
    modifiedAt?: string;
    databaseType?: DatabaseType;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    schema?: string;
    connectionString?: string;
    mongoDatabase?: string;
    baseUrl?: string;
    headers?: Record<string, string>;
    authentication?: {
        type: 'NONE' | 'BASIC' | 'BEARER' | 'OAUTH';
        username?: string;
        password?: string;
        token?: string;
    };
    filePath?: string;
    fileUrl?: string;
    hasHeaders?: boolean;
    encoding?: string;
    poolSize?: number;
    timeout?: number;
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
    queryText: string;
    parameters?: QueryParameter[];
    timeout?: number;
    caching?: {
        enabled: boolean;
        duration?: number;
        keyExpression?: string;
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
    data?: any[];
    columns?: ColumnMetadata[];
    rowCount?: number;
    executionTime?: number;
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
    condition: string;
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
    values?: any[];
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
    breakOnChange?: boolean;
    keepTogether?: boolean;
    hideDetails?: boolean;
}
export interface SubtotalDefinition {
    id: string;
    name: string;
    field: string;
    function: 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX' | 'STDDEV' | 'VARIANCE';
    groupLevel?: number;
    placement: 'HEADER' | 'FOOTER' | 'BOTH';
    format?: string;
    style?: TextStyle;
}
export interface RunningTotalDefinition {
    id: string;
    name: string;
    field: string;
    expression?: string;
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
    body: string;
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
    customComparator?: string;
}
export interface ReportDefinition {
    id: string;
    name: string;
    displayName?: string;
    description?: string;
    version: string;
    status: ReportStatus;
    pageSetup: PageSetup;
    bands: Band[];
    dataSources: DataSourceBinding[];
    parameters: ReportParameter[];
    grouping?: GroupingConfiguration;
    filtering?: AdvancedFilteringConfiguration;
    sorting?: AdvancedSortingConfiguration;
    customFunctions?: CustomFunction[];
    runningTotals?: RunningTotalDefinition[];
    backgroundColor?: string;
    defaultStyle?: TextStyle;
    pageNumberStartAt?: number;
    rowsPerPage?: number;
    maxRowCount?: number;
    timeoutSeconds?: number;
    author?: string;
    tags?: string[];
    createdAt?: string;
    createdBy?: string;
    modifiedAt?: string;
    modifiedBy?: string;
    isPublic?: boolean;
    shareWith?: string[];
}
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'HTML' | 'WORD' | 'JSON' | 'XML';
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
export interface DesignerState {
    report: ReportDefinition;
    selectedBandId?: string;
    selectedObjectId?: string;
    selectedGroupingField?: string;
    zoom: number;
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
    isDirty: boolean;
    history: DesignerHistoryState[];
    historyIndex: number;
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
    autosaveInterval?: number;
    undoStackSize?: number;
    alignmentGuideColor?: string;
}
export interface BandEditorState {
    bandId: string;
    editingProperties: boolean;
    expandedGroups?: string[];
}
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
//# sourceMappingURL=types.d.ts.map