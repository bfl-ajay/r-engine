/**
 * Designer Redux Store
 * Manages the state of the report designer
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  ReportDefinition,
  Band,
  ReportObject,
  DesignerState,
  BandType,
  ReportObjectType,
} from '../../../packages/shared/src/types';
import {
  createEmptyReport,
  createBand,
  createReportObject,
  addBandToReport,
  addObjectToBand,
  updateObject,
  deleteObject,
} from '../../../packages/shared/src/utils';

const initialState: DesignerState = {
  report: createEmptyReport('Untitled Report'),
  zoom: 100,
  showGrid: true,
  gridSize: 10,
  snapToGrid: true,
  isDirty: false,
  history: [],
};

const designerSlice = createSlice({
  name: 'designer',
  initialState,
  reducers: {
    // Report operations
    loadReport: (state, action: PayloadAction<ReportDefinition>) => {
      state.report = action.payload;
      state.isDirty = false;
      state.history = [];
    },

    updateReportMetadata: (
      state,
      action: PayloadAction<Partial<ReportDefinition>>
    ) => {
      state.report = { ...state.report, ...action.payload };
      state.isDirty = true;
    },

    // Band operations
    addBand: (state, action: PayloadAction<BandType>) => {
      const band = createBand(action.payload);
      state.report = addBandToReport(state.report, band);
      state.isDirty = true;
    },

    updateBand: (state, action: PayloadAction<Band>) => {
      const bandIndex = state.report.bands.findIndex(b => b.id === action.payload.id);
      if (bandIndex !== -1) {
        state.report.bands[bandIndex] = action.payload;
        state.isDirty = true;
      }
    },

    deleteBand: (state, action: PayloadAction<string>) => {
      state.report.bands = state.report.bands.filter(b => b.id !== action.payload);
      if (state.selectedBandId === action.payload) {
        state.selectedBandId = undefined;
      }
      state.isDirty = true;
    },

    selectBand: (state, action: PayloadAction<string | undefined>) => {
      state.selectedBandId = action.payload;
      state.selectedObjectId = undefined;
    },

    // Object operations
    addObject: (
      state,
      action: PayloadAction<{
        bandId: string;
        objectType: ReportObjectType;
      }>
    ) => {
      const object = createReportObject(action.payload.objectType, action.payload.bandId);
      state.report = addObjectToBand(state.report, action.payload.bandId, object);
      state.selectedObjectId = object.id;
      state.isDirty = true;
    },

    updateObject: (
      state,
      action: PayloadAction<{
        objectId: string;
        updates: Partial<ReportObject>;
      }>
    ) => {
      const { objectId, updates } = action.payload;
      // Find and update the object
      state.report = updateObject(state.report, objectId, updates);
      state.isDirty = true;
    },

    deleteObject: (state, action: PayloadAction<string>) => {
      state.report = deleteObject(state.report, action.payload);
      if (state.selectedObjectId === action.payload) {
        state.selectedObjectId = undefined;
      }
      state.isDirty = true;
    },

    selectObject: (state, action: PayloadAction<string | undefined>) => {
      state.selectedObjectId = action.payload;
    },

    // Designer UI operations
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(50, Math.min(200, action.payload));
    },

    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },

    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload;
    },

    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload;
    },

    // History/undo
    clearHistory: (state) => {
      state.history = [];
      state.isDirty = false;
    },

    markClean: (state) => {
      state.isDirty = false;
    },

    // Batch operations
    resetDesigner: (state) => {
      state.report = createEmptyReport('Untitled Report');
      state.selectedBandId = undefined;
      state.selectedObjectId = undefined;
      state.zoom = 100;
      state.isDirty = false;
      state.history = [];
    },
  },
});

export const {
  loadReport,
  updateReportMetadata,
  addBand,
  updateBand,
  deleteBand,
  selectBand,
  addObject,
  updateObject,
  deleteObject,
  selectObject,
  setZoom,
  toggleGrid,
  setGridSize,
  setSnapToGrid,
  clearHistory,
  markClean,
  resetDesigner,
} = designerSlice.actions;

export default designerSlice.reducer;

// Selectors
export const selectReport = (state: any) => state.designer.report;
export const selectSelectedBandId = (state: any) => state.designer.selectedBandId;
export const selectSelectedObjectId = (state: any) => state.designer.selectedObjectId;
export const selectZoom = (state: any) => state.designer.zoom;
export const selectShowGrid = (state: any) => state.designer.showGrid;
export const selectGridSize = (state: any) => state.designer.gridSize;
export const selectSnapToGrid = (state: any) => state.designer.snapToGrid;
export const selectIsDirty = (state: any) => state.designer.isDirty;
