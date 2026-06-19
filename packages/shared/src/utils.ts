/**
 * Report Engine Utilities
 * Helper functions for working with reports, bands, and objects
 */

import { 
  BandType, 
  ReportObjectType, 
  Band, 
  ReportObject,
  ReportDefinition 
} from './types';

// ============================================================================
// BAND UTILITIES
// ============================================================================

export const BAND_DISPLAY_NAMES: Record<BandType, string> = {
  TITLE: 'Title',
  HEADER: 'Page Header',
  DATA: 'Data',
  GROUP_HEADER: 'Group Header',
  GROUP_FOOTER: 'Group Footer',
  DETAIL: 'Detail',
  FOOTER: 'Page Footer',
  REPORT_FOOTER: 'Report Footer',
  OVERLAY: 'Overlay',
  CHILD: 'Child',
  GROUP_OVERLAY: 'Group Overlay',
  REPORT_HEADER: 'Report Header',
  REPORT_SUMMARY: 'Report Summary',
};

export const BAND_DEFAULT_HEIGHTS: Record<BandType, number> = {
  TITLE: 60,
  HEADER: 40,
  DATA: 40,
  GROUP_HEADER: 40,
  GROUP_FOOTER: 40,
  DETAIL: 40,
  FOOTER: 40,
  REPORT_FOOTER: 60,
  OVERLAY: 60,
  CHILD: 100,
  GROUP_OVERLAY: 60,
  REPORT_HEADER: 60,
  REPORT_SUMMARY: 60,
};

/**
 * Get logical band order for rendering
 */
export const getBandRenderOrder = (): BandType[] => [
  'REPORT_HEADER',
  'TITLE',
  'HEADER',
  'GROUP_HEADER',
  'DATA',
  'DETAIL',
  'GROUP_FOOTER',
  'FOOTER',
  'REPORT_FOOTER',
  'OVERLAY',
  'GROUP_OVERLAY',
  'CHILD',
  'REPORT_SUMMARY',
];

/**
 * Check if a band type can repeat (appears multiple times)
 */
export const isBandRepeatable = (bandType: BandType): boolean => {
  const repeatableBands: BandType[] = [
    'HEADER',
    'DATA',
    'DETAIL',
    'GROUP_HEADER',
    'GROUP_FOOTER',
    'FOOTER',
  ];
  return repeatableBands.includes(bandType);
};

/**
 * Check if a band type appears only once per report
 */
export const isBandSingular = (bandType: BandType): boolean => {
  const singularBands: BandType[] = [
    'TITLE',
    'REPORT_HEADER',
    'REPORT_FOOTER',
    'REPORT_SUMMARY',
  ];
  return singularBands.includes(bandType);
};

// ============================================================================
// REPORT OBJECT UTILITIES
// ============================================================================

export const OBJECT_DISPLAY_NAMES: Record<ReportObjectType, string> = {
  TEXT: 'Text',
  LABEL: 'Label',
  FIELD: 'Data Field',
  EXPRESSION: 'Expression',
  IMAGE: 'Image',
  SHAPE: 'Shape',
  LINE: 'Line',
  TABLE: 'Table',
  MATRIX: 'Matrix',
  CHART: 'Chart',
  BARCODE: 'Barcode',
  QRCODE: 'QR Code',
  SUBREPORT: 'Subreport',
  PAGE_NUMBER: 'Page Number',
  TOTAL_PAGES: 'Total Pages',
  DATE_TIME: 'Date/Time',
};

export const DRAGGABLE_OBJECTS: ReportObjectType[] = [
  'TEXT',
  'LABEL',
  'FIELD',
  'EXPRESSION',
  'IMAGE',
  'SHAPE',
  'LINE',
  'TABLE',
  'MATRIX',
  'CHART',
  'BARCODE',
  'QRCODE',
  'SUBREPORT',
  'PAGE_NUMBER',
  'TOTAL_PAGES',
  'DATE_TIME',
];

/**
 * Get default size for a new object type
 */
export const getDefaultObjectSize = (objectType: ReportObjectType) => {
  const defaults: Record<ReportObjectType, { width: number; height: number }> = {
    TEXT: { width: 100, height: 20 },
    LABEL: { width: 80, height: 20 },
    FIELD: { width: 100, height: 20 },
    EXPRESSION: { width: 100, height: 20 },
    IMAGE: { width: 150, height: 100 },
    SHAPE: { width: 100, height: 100 },
    LINE: { width: 100, height: 2 },
    TABLE: { width: 300, height: 150 },
    MATRIX: { width: 300, height: 150 },
    CHART: { width: 300, height: 200 },
    BARCODE: { width: 120, height: 60 },
    QRCODE: { width: 100, height: 100 },
    SUBREPORT: { width: 300, height: 200 },
    PAGE_NUMBER: { width: 50, height: 20 },
    TOTAL_PAGES: { width: 50, height: 20 },
    DATE_TIME: { width: 100, height: 20 },
  };
  return defaults[objectType];
};

/**
 * Get object categories for UI grouping
 */
export const getObjectCategories = () => ({
  'Text & Data': ['TEXT', 'LABEL', 'FIELD', 'EXPRESSION'],
  'Media': ['IMAGE', 'SHAPE', 'LINE'],
  'Data Display': ['TABLE', 'MATRIX', 'CHART'],
  'Codes': ['BARCODE', 'QRCODE'],
  'Special': ['SUBREPORT', 'PAGE_NUMBER', 'TOTAL_PAGES', 'DATE_TIME'],
});

// ============================================================================
// REPORT UTILITIES
// ============================================================================

/**
 * Create a new empty report definition
 */
export const createEmptyReport = (name: string, reportId?: string): ReportDefinition => ({
  id: reportId || `report-${Date.now()}`,
  name,
  displayName: name,
  version: '1.0.0',
  status: 'DRAFT',
  pageSetup: {
    paperSize: 'A4',
    orientation: 'PORTRAIT',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  bands: [
    createBand('REPORT_HEADER', 'Report Header'),
    createBand('HEADER', 'Page Header'),
    createBand('DATA', 'Data'),
    createBand('FOOTER', 'Page Footer'),
    createBand('REPORT_FOOTER', 'Report Footer'),
  ],
  dataSources: [],
  parameters: [],
  backgroundColor: '#FFFFFF',
  createdAt: new Date().toISOString(),
});

/**
 * Create a new band
 */
export const createBand = (type: BandType, name?: string): Band => ({
  id: `band-${Date.now()}-${Math.random()}`,
  type,
  name: name || BAND_DISPLAY_NAMES[type],
  height: BAND_DEFAULT_HEIGHTS[type],
  visible: true,
  children: [],
  backgroundColor: '#FFFFFF',
  borderColor: '#CCCCCC',
  borderWidth: 1,
});

/**
 * Create a new report object
 */
export const createReportObject = (
  type: ReportObjectType,
  bandId: string,
  name?: string
): ReportObject => {
  const size = getDefaultObjectSize(type);
  return {
    id: `object-${Date.now()}-${Math.random()}`,
    bandId,
    type,
    name: name || OBJECT_DISPLAY_NAMES[type],
    position: { x: 10, y: 10 },
    size,
    visible: true,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      borderWidth: 1,
    },
    textStyle: {
      fontFamily: 'Arial',
      fontSize: 12,
      color: '#000000',
    },
  };
};

/**
 * Find a band by ID
 */
export const findBand = (report: ReportDefinition, bandId: string): Band | undefined => {
  return report.bands.find(band => band.id === bandId);
};

/**
 * Find a report object by ID (searches all bands)
 */
export const findReportObject = (
  report: ReportDefinition,
  objectId: string
): ReportObject | undefined => {
  for (const band of report.bands) {
    const found = band.children.find(obj => obj.id === objectId);
    if (found) return found;
  }
  return undefined;
};

/**
 * Add a band to a report
 */
export const addBandToReport = (
  report: ReportDefinition,
  band: Band
): ReportDefinition => ({
  ...report,
  bands: [...report.bands, band],
});

/**
 * Add an object to a band
 */
export const addObjectToBand = (
  report: ReportDefinition,
  bandId: string,
  object: ReportObject
): ReportDefinition => ({
  ...report,
  bands: report.bands.map(band =>
    band.id === bandId
      ? { ...band, children: [...band.children, object] }
      : band
  ),
});

/**
 * Update an object in a band
 */
export const updateObject = (
  report: ReportDefinition,
  objectId: string,
  updates: Partial<ReportObject>
): ReportDefinition => ({
  ...report,
  bands: report.bands.map(band => ({
    ...band,
    children: band.children.map(obj =>
      obj.id === objectId ? { ...obj, ...updates } : obj
    ),
  })),
});

/**
 * Delete an object from a band
 */
export const deleteObject = (
  report: ReportDefinition,
  objectId: string
): ReportDefinition => ({
  ...report,
  bands: report.bands.map(band => ({
    ...band,
    children: band.children.filter(obj => obj.id !== objectId),
  })),
});

/**
 * Clone a report object
 */
export const cloneObject = (object: ReportObject): ReportObject => ({
  ...object,
  id: `object-${Date.now()}-${Math.random()}`,
  position: {
    x: object.position.x + 10,
    y: object.position.y + 10,
  },
});

/**
 * Validate report definition (basic checks)
 */
export const validateReport = (report: ReportDefinition): string[] => {
  const errors: string[] = [];

  if (!report.name?.trim()) {
    errors.push('Report name is required');
  }

  if (report.bands.length === 0) {
    errors.push('Report must have at least one band');
  }

  // Check for duplicate band names
  const bandNames = report.bands.map(b => b.name);
  const duplicateNames = bandNames.filter((name, idx) => bandNames.indexOf(name) !== idx);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate band names: ${duplicateNames.join(', ')}`);
  }

  return errors;
};

// ============================================================================
// DESIGNER STATE UTILITIES
// ============================================================================

/**
 * Calculate canvas dimensions for a report
 */
export const calculateCanvasDimensions = (report: ReportDefinition) => {
  const { pageSetup } = report;
  const { marginLeft = 0, marginRight = 0, marginTop = 0, marginBottom = 0 } = pageSetup;

  const paperDimensions: Record<string, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    LETTER: { width: 216, height: 279 },
    LEGAL: { width: 216, height: 356 },
    TABLOID: { width: 279, height: 432 },
  };

  let width = 210; // A4 default
  let height = 297;

  if (pageSetup.paperSize !== 'CUSTOM' && paperDimensions[pageSetup.paperSize]) {
    const dims = paperDimensions[pageSetup.paperSize];
    if (pageSetup.orientation === 'LANDSCAPE') {
      width = dims.height;
      height = dims.width;
    } else {
      width = dims.width;
      height = dims.height;
    }
  } else if (pageSetup.width && pageSetup.height) {
    width = pageSetup.width;
    height = pageSetup.height;
  }

  // Convert mm to pixels (1mm ≈ 3.78px at 96 dpi)
  const pxWidth = width * 3.78;
  const pxHeight = height * 3.78;

  const contentWidth = pxWidth - marginLeft - marginRight;
  const contentHeight = pxHeight - marginTop - marginBottom;

  return {
    pageWidth: pxWidth,
    pageHeight: pxHeight,
    contentWidth,
    contentHeight,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
  };
};
