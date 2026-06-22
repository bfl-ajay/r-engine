/**
 * Report Engine Utilities
 * Helper functions for working with reports, bands, and objects
 */
import { BandType, ReportObjectType, Band, ReportObject, ReportDefinition } from './types';
export declare const BAND_DISPLAY_NAMES: Record<BandType, string>;
export declare const BAND_DEFAULT_HEIGHTS: Record<BandType, number>;
/**
 * Get logical band order for rendering
 */
export declare const getBandRenderOrder: () => BandType[];
/**
 * Check if a band type can repeat (appears multiple times)
 */
export declare const isBandRepeatable: (bandType: BandType) => boolean;
/**
 * Check if a band type appears only once per report
 */
export declare const isBandSingular: (bandType: BandType) => boolean;
export declare const OBJECT_DISPLAY_NAMES: Record<ReportObjectType, string>;
export declare const DRAGGABLE_OBJECTS: ReportObjectType[];
/**
 * Get default size for a new object type
 */
export declare const getDefaultObjectSize: (objectType: ReportObjectType) => {
    width: number;
    height: number;
};
/**
 * Get object categories for UI grouping
 */
export declare const getObjectCategories: () => {
    'Text & Data': string[];
    Media: string[];
    'Data Display': string[];
    Codes: string[];
    Special: string[];
};
/**
 * Create a new empty report definition
 */
export declare const createEmptyReport: (name: string, reportId?: string) => ReportDefinition;
/**
 * Create a new band
 */
export declare const createBand: (type: BandType, name?: string) => Band;
/**
 * Create a new report object
 */
export declare const createReportObject: (type: ReportObjectType, bandId: string, name?: string) => ReportObject;
/**
 * Find a band by ID
 */
export declare const findBand: (report: ReportDefinition, bandId: string) => Band | undefined;
/**
 * Find a report object by ID (searches all bands)
 */
export declare const findReportObject: (report: ReportDefinition, objectId: string) => ReportObject | undefined;
/**
 * Add a band to a report
 */
export declare const addBandToReport: (report: ReportDefinition, band: Band) => ReportDefinition;
/**
 * Add an object to a band
 */
export declare const addObjectToBand: (report: ReportDefinition, bandId: string, object: ReportObject) => ReportDefinition;
/**
 * Update an object in a band
 */
export declare const updateObject: (report: ReportDefinition, objectId: string, updates: Partial<ReportObject>) => ReportDefinition;
/**
 * Delete an object from a band
 */
export declare const deleteObject: (report: ReportDefinition, objectId: string) => ReportDefinition;
/**
 * Clone a report object
 */
export declare const cloneObject: (object: ReportObject) => ReportObject;
/**
 * Validate report definition (basic checks)
 */
export declare const validateReport: (report: ReportDefinition) => string[];
/**
 * Calculate canvas dimensions for a report
 */
export declare const calculateCanvasDimensions: (report: ReportDefinition) => {
    pageWidth: number;
    pageHeight: number;
    contentWidth: number;
    contentHeight: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
};
//# sourceMappingURL=utils.d.ts.map