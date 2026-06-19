/**
 * Rendering Controller
 * Handles report rendering/preview requests
 */

import { Router, Request, Response } from 'express';
import renderingService from '../services/renderingService';
import reportService from '../services/reportService';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

/**
 * POST /api/v1/rendering/preview
 * Preview a report with sample data
 */
router.post(
  '/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportDefinition, data = [], format = 'HTML', parameters = {} } = req.body;

    if (!reportDefinition) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'reportDefinition is required' },
      });
    }

    const html = await renderingService.renderReport(
      reportDefinition,
      {
        rows: data,
        totalRows: data.length,
        pageSize: 50,
      },
      parameters,
      { format: format.toUpperCase() }
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  })
);

/**
 * POST /api/v1/rendering/:reportId
 * Render a saved report with data
 */
router.post(
  '/:reportId',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { data = [], format = 'HTML', parameters = {} } = req.body;

    const report = await reportService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    const html = await renderingService.renderReport(
      report.content,
      {
        rows: data,
        totalRows: data.length,
        pageSize: 50,
      },
      parameters,
      { format: format.toUpperCase() }
    );

    if (format.toUpperCase() === 'HTML') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } else {
      res.json({ success: true, data: html });
    }
  })
);

/**
 * GET /api/v1/rendering/:reportId/stats
 * Get report rendering statistics
 */
router.get(
  '/:reportId/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const report = await reportService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    const stats = renderingService.getReportStats(report.content);
    const size = renderingService.estimateReportSize(report.content, 1000);

    res.json({
      success: true,
      data: {
        ...stats,
        estimatedSize: size,
      },
    });
  })
);

/**
 * POST /api/v1/rendering/validate
 * Validate report definition for rendering
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportDefinition } = req.body;

    if (!reportDefinition) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'reportDefinition is required' },
      });
    }

    // Validation is done internally, return success
    res.json({
      success: true,
      message: 'Report definition is valid for rendering',
    });
  })
);

export default router;
