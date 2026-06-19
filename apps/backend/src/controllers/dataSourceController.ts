/**
 * Data Source Controller
 * REST API endpoints for data source management
 */

import { Router } from 'express';
import { DataSourceConnection, QueryDefinition } from '@report-engine/shared';
import { dataSourceService } from '../services/dataSourceService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validatePaginationParams } from '../middlewares/validation';

const router = Router();

// ============================================================================
// CONNECTION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/data-sources/connections
 * List all connections with pagination
 */
router.get(
  '/connections',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const result = await dataSourceService.listConnections(pageNum, limitNum);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * POST /api/v1/data-sources/connections
 * Create a new connection
 */
router.post(
  '/connections',
  asyncHandler(async (req, res) => {
    const input = req.body as DataSourceConnection;

    if (!input.name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Connection name is required' },
      });
    }

    const connection = await dataSourceService.createConnection(input);

    res.status(201).json({
      success: true,
      data: connection,
    });
  })
);

/**
 * GET /api/v1/data-sources/connections/:connectionId
 * Get a specific connection
 */
router.get(
  '/connections/:connectionId',
  asyncHandler(async (req, res) => {
    const connection = await dataSourceService.getConnectionById(req.params.connectionId);

    res.json({
      success: true,
      data: connection,
    });
  })
);

/**
 * PUT /api/v1/data-sources/connections/:connectionId
 * Update a connection
 */
router.put(
  '/connections/:connectionId',
  asyncHandler(async (req, res) => {
    const updates = req.body as Partial<DataSourceConnection>;
    const connection = await dataSourceService.updateConnection(req.params.connectionId, updates);

    res.json({
      success: true,
      data: connection,
    });
  })
);

/**
 * DELETE /api/v1/data-sources/connections/:connectionId
 * Delete a connection
 */
router.delete(
  '/connections/:connectionId',
  asyncHandler(async (req, res) => {
    await dataSourceService.deleteConnection(req.params.connectionId);

    res.json({
      success: true,
      message: 'Connection deleted',
    });
  })
);

/**
 * POST /api/v1/data-sources/connections/:connectionId/test
 * Test a connection
 */
router.post(
  '/connections/:connectionId/test',
  asyncHandler(async (req, res) => {
    const result = await dataSourceService.testConnection(req.params.connectionId);

    res.json({
      success: result.success,
      message: result.message,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
    });
  })
);

/**
 * GET /api/v1/data-sources/connections/:connectionId/schema
 * Get connection schema
 */
router.get(
  '/connections/:connectionId/schema',
  asyncHandler(async (req, res) => {
    const schema = await dataSourceService.getConnectionSchema(req.params.connectionId);

    res.json({
      success: true,
      data: schema,
    });
  })
);

// ============================================================================
// QUERY ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/data-sources/connections/:connectionId/queries
 * List queries for a connection
 */
router.get(
  '/connections/:connectionId/queries',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const result = await dataSourceService.listQueries(req.params.connectionId, pageNum, limitNum);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * POST /api/v1/data-sources/queries
 * Create a new query
 */
router.post(
  '/queries',
  asyncHandler(async (req, res) => {
    const input = req.body as QueryDefinition;

    if (!input.name || !input.connectionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name and connectionId are required' },
      });
    }

    const query = await dataSourceService.createQuery(input);

    res.status(201).json({
      success: true,
      data: query,
    });
  })
);

/**
 * GET /api/v1/data-sources/queries/:queryId
 * Get a specific query
 */
router.get(
  '/queries/:queryId',
  asyncHandler(async (req, res) => {
    const query = await dataSourceService.getQueryById(req.params.queryId);

    res.json({
      success: true,
      data: query,
    });
  })
);

/**
 * POST /api/v1/data-sources/queries/:queryId/execute
 * Execute a query
 */
router.post(
  '/queries/:queryId/execute',
  asyncHandler(async (req, res) => {
    const { parameters } = req.body;

    const result = await dataSourceService.executeQuery(req.params.queryId, parameters);

    res.json({
      success: result.success,
      data: result.data,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      error: result.error,
    });
  })
);

/**
 * POST /api/v1/data-sources/queries/:queryId/preview
 * Preview query results
 */
router.post(
  '/queries/:queryId/preview',
  asyncHandler(async (req, res) => {
    const { limit = 10, parameters } = req.body;

    const result = await dataSourceService.previewQuery(req.params.queryId, limit, parameters);

    res.json({
      success: result.success,
      data: result.data,
      rowCount: result.rowCount,
      error: result.error,
    });
  })
);

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/data-sources/validate-query
 * Validate a query syntax
 */
router.post(
  '/validate-query',
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Query is required' },
      });
    }

    // Basic validation - can be extended for specific database types
    const isValid = query.trim().length > 0;

    res.json({
      success: isValid,
      message: isValid ? 'Query is valid' : 'Query is empty',
    });
  })
);

/**
 * GET /api/v1/data-sources/info
 * Get data sources info
 */
router.get(
  '/info',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        supportedTypes: ['SQL', 'MONGODB', 'API', 'CSV', 'JSON', 'XML', 'EXCEL'],
        supportedDatabases: ['POSTGRESQL', 'MYSQL', 'MSSQL', 'ORACLE'],
        supportedAuth: ['NONE', 'BASIC', 'BEARER', 'OAUTH'],
        features: {
          queryBuilder: true,
          schemIntrospection: true,
          caching: true,
          pagination: true,
        },
      },
    });
  })
);

export default router;
