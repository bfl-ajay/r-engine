/**
 * Execution Controller
 * Handles report execution requests
 */

import { Router, Request, Response } from 'express';
import executionService from '../services/executionService';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

/**
 * POST /api/v1/executions
 * Execute a report
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { reportId, parameters = {} } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'reportId is required' },
      });
    }

    const instance = await executionService.executeReport(reportId, parameters);
    res.status(201).json({ success: true, data: instance });
  })
);

/**
 * GET /api/v1/executions/:executionId
 * Get execution status
 */
router.get(
  '/:executionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    const instance = await executionService.getExecutionStatus(executionId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Execution not found' },
      });
    }

    res.json({ success: true, data: instance });
  })
);

/**
 * GET /api/v1/executions/:executionId/result
 * Get execution result
 */
router.get(
  '/:executionId/result',
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    const { format = 'JSON' } = req.query;

    const result = await executionService.getExecutionResult(executionId, format as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Execution result not found' },
      });
    }

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/v1/executions/:executionId/cancel
 * Cancel execution
 */
router.post(
  '/:executionId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    const result = await executionService.cancelExecution(executionId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Execution not found' },
      });
    }

    res.json({ success: true, message: 'Execution cancelled' });
  })
);

/**
 * DELETE /api/v1/executions/:executionId
 * Delete execution result
 */
router.delete(
  '/:executionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    await executionService.deleteExecution(executionId);
    res.json({ success: true, message: 'Execution deleted' });
  })
);

export default router;
