import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import reportController from './controllers/reportController';
import executionController from './controllers/executionController';
import renderingController from './controllers/renderingController';
import dataSourceController from './controllers/dataSourceController';
import { errorHandler } from './middlewares/errorHandler';
import config from './config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' })); // Increased limit for report data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'API healthy', version: '1.0.0' });
});

// Report routes
app.use('/api/v1/reports', reportController);

// Execution routes
app.use('/api/v1/executions', executionController);

// Rendering routes
app.use('/api/v1/rendering', renderingController);

// Data Source routes
app.use('/api/v1/data-sources', dataSourceController);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not Found' } });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${config.node_env}`);
  console.log(`Log Level: ${config.log_level}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/v1/reports');
  console.log('  POST /api/v1/reports');
  console.log('  POST /api/v1/executions');
  console.log('  POST /api/v1/rendering/preview');
  console.log('  GET  /api/v1/data-sources/connections');
  console.log('  POST /api/v1/data-sources/connections');
  console.log('  POST /api/v1/data-sources/queries/:queryId/execute');
});

export default app;
