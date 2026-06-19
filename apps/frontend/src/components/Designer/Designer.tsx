/**
 * Report Designer Component
 * Main report designer interface with Canvas and ObjectPalette
 */

import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Canvas } from './Canvas';
import { ObjectPalette } from './ObjectPalette';
import { PropertyEditor } from './PropertyEditor';
import { BandManager } from './BandManager';
import {
  selectReport,
  selectZoom,
  selectShowGrid,
  selectIsDirty,
  setZoom,
  toggleGrid,
} from '../store/designerSlice';
import type { AppDispatch } from '../store';
import styles from './Designer.module.css';

interface DesignerProps {
  reportId?: string;
  onSave?: (report: any) => void;
}

export const Designer: React.FC<DesignerProps> = ({ reportId, onSave }) => {
  const dispatch = useDispatch<AppDispatch>();
  const report = useSelector(selectReport);
  const zoom = useSelector(selectZoom);
  const showGrid = useSelector(selectShowGrid);
  const isDirty = useSelector(selectIsDirty);
  
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [resizingRightSidebar, setResizingRightSidebar] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleZoomIn = useCallback(() => {
    dispatch(setZoom(Math.min(200, zoom + 10)));
  }, [dispatch, zoom]);

  const handleZoomOut = useCallback(() => {
    dispatch(setZoom(Math.max(50, zoom - 10)));
  }, [dispatch, zoom]);

  const handleToggleGrid = useCallback(() => {
    dispatch(toggleGrid());
  }, [dispatch]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(report);
    }
  }, [report, onSave]);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleMouseMoveResize = (e: MouseEvent) => {
    if (resizingSidebar) {
      setSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
    }
    if (resizingRightSidebar) {
      setRightSidebarWidth(Math.max(250, Math.min(600, window.innerWidth - e.clientX)));
    }
  };

  const handleMouseUpResize = () => {
    setResizingSidebar(false);
    setResizingRightSidebar(false);
  };

  React.useEffect(() => {
    if (resizingSidebar || resizingRightSidebar) {
      document.addEventListener('mousemove', handleMouseMoveResize);
      document.addEventListener('mouseup', handleMouseUpResize);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveResize);
        document.removeEventListener('mouseup', handleMouseUpResize);
      };
    }
  }, [resizingSidebar, resizingRightSidebar]);

  return (
    <Box className={styles.container}>
      {/* Top Toolbar */}
      <AppBar position="static" className={styles.toolbar}>
        <Toolbar size="dense">
          <Box className={styles.toolbarTitle}>
            <h2>{report.displayName || report.name}</h2>
            {isDirty && <span className={styles.unsavedIndicator}>*</span>}
          </Box>

          <Box className={styles.toolbarButtons}>
            {/* Zoom Controls */}
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <span className={styles.zoomLabel}>{zoom}%</span>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {/* Grid Toggle */}
            <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
              <IconButton size="small" onClick={handleToggleGrid}>
                {showGrid ? <GridOnIcon /> : <GridOffIcon />}
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {/* Save */}
            <Tooltip title="Save Report">
              <span>
                <IconButton size="small" onClick={handleSave} disabled={!isDirty}>
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* Undo/Redo (placeholder) */}
            <Tooltip title="Undo">
              <span>
                <IconButton size="small" disabled>
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton size="small" disabled>
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {/* Export Menu */}
            <Tooltip title="Export Report">
              <Button
                size="small"
                endIcon={<DownloadIcon />}
                onClick={handleExportMenuOpen}
              >
                Export
              </Button>
            </Tooltip>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem onClick={handleExportMenuClose}>PDF</MenuItem>
              <MenuItem onClick={handleExportMenuClose}>Excel</MenuItem>
              <MenuItem onClick={handleExportMenuClose}>HTML</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box className={styles.content}>
        {/* Left Sidebar - Object Palette & Band Manager */}
        <Box
          className={styles.leftSidebar}
          style={{ width: `${sidebarWidth}px` }}
        >
          <ObjectPalette />
          <Divider />
          <BandManager />
        </Box>

        {/* Sidebar Resizer */}
        <Box
          className={styles.sidebarResizer}
          onMouseDown={() => setResizingSidebar(true)}
        />

        {/* Main Canvas Area */}
        <Box className={styles.canvasArea}>
          <Canvas zoom={zoom} />
        </Box>

        {/* Right Sidebar Resizer */}
        <Box
          className={styles.sidebarResizer}
          onMouseDown={() => setResizingRightSidebar(true)}
        />

        {/* Right Sidebar - Property Editor */}
        <Box
          className={styles.rightSidebar}
          style={{ width: `${rightSidebarWidth}px` }}
        >
          <PropertyEditor />
        </Box>
      </Box>
    </Box>
  );
};

export default Designer;
