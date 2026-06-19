/**
 * Report Controller
 * Handles HTTP requests for report operations
 */

import { Router, Request, Response } from 'express';
import reportService from '../services/reportService';
import { validateReportInput, validatePaginationParams } from '../middlewares/validation';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

/**
 * GET /api/v1/reports
 * Get all reports with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, status } = req.query;
    const params = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
      search: search as string,
      status: status as string,
    };

    const result = await reportService.getAllReports(params);
    res.json({ success: true, data: result });
  })
);

/**
 * GET /api/v1/reports/:reportId
 * Get a specific report by ID
 */
router.get(
  '/:reportId',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const report = await reportService.getReportById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    res.json({ success: true, data: report });
  })
);

/**
 * POST /api/v1/reports
 * Create a new report
 */
router.post(
  '/',
  validateReportInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, displayName, description, pageSetup } = req.body;
    const report = await reportService.createReport({
      name,
      displayName: displayName || name,
      description,
      pageSetup,
    });

    res.status(201).json({ success: true, data: report });
  })
);

/**
 * PUT /api/v1/reports/:reportId
 * Update a report
 */
router.put(
  '/:reportId',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const updates = req.body;

    const report = await reportService.updateReport(reportId, updates);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    res.json({ success: true, data: report });
  })
);

/**
 * DELETE /api/v1/reports/:reportId
 * Delete a report
 */
router.delete(
  '/:reportId',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    await reportService.deleteReport(reportId);
    res.json({ success: true, message: 'Report deleted' });
  })
);

/**
 * POST /api/v1/reports/:reportId/publish
 * Publish a report
 */
router.post(
  '/:reportId/publish',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const report = await reportService.publishReport(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    res.json({ success: true, data: report });
  })
);

/**
 * POST /api/v1/reports/:reportId/execute
 * Execute a report
 */
router.post(
  '/:reportId/execute',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { parameters } = req.body;

    const instance = await reportService.executeReport(reportId, parameters || {});
    res.status(201).json({ success: true, data: instance });
  })
);

/**
 * GET /api/v1/reports/:reportId/versions
 * Get report versions
 */
router.get(
  '/:reportId/versions',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const versions = await reportService.getReportVersions(reportId);
    res.json({ success: true, data: versions });
  })
);

export default router;
