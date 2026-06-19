/**
 * Canvas Component
 * Renders the report design canvas where users manipulate bands and objects
 */

import React, { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper } from '@mui/material';
import {
  selectReport,
  selectSelectedObjectId,
  selectGridSize,
  selectSnapToGrid,
  selectObject,
  updateObject,
} from '../../store/designerSlice';
import { calculateCanvasDimensions } from '../../../packages/shared/src/utils';
import type { AppDispatch } from '../../store';
import { CanvasBand } from './CanvasBand';
import styles from './Canvas.module.css';

interface CanvasProps {
  zoom: number;
}

interface DragState {
  objectId: string;
  startX: number;
  startY: number;
  startObjX: number;
  startObjY: number;
}

export const Canvas: React.FC<CanvasProps> = ({ zoom }) => {
  const dispatch = useDispatch<AppDispatch>();
  const report = useSelector(selectReport);
  const selectedObjectId = useSelector(selectSelectedObjectId);
  const gridSize = useSelector(selectGridSize);
  const snapToGrid = useSelector(selectSnapToGrid);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const dimensions = calculateCanvasDimensions(report);
  const zoomFactor = zoom / 100;

  // Snap value to grid
  const snapValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === canvasRef.current) {
        // Clicked on empty canvas - deselect
        dispatch(selectObject(undefined));
      }
    },
    [dispatch]
  );

  const handleObjectMouseDown = useCallback(
    (e: React.MouseEvent, objectId: string, objX: number, objY: number) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(selectObject(objectId));
      
      if (e.button === 0) { // Left mouse button
        setDragState({
          objectId,
          startX: e.clientX,
          startY: e.clientY,
          startObjX: objX,
          startObjY: objY,
        });
      }
    },
    [dispatch]
  );

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragState) {
        const deltaX = (e.clientX - dragState.startX) / zoomFactor;
        const deltaY = (e.clientY - dragState.startY) / zoomFactor;

        const newX = snapValue(dragState.startObjX + deltaX);
        const newY = snapValue(dragState.startObjY + deltaY);

        dispatch(
          updateObject({
            objectId: dragState.objectId,
            updates: {
              position: { x: newX, y: newY },
            },
          })
        );
      }
    },
    [dragState, zoomFactor, snapToGrid, gridSize, dispatch]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  return (
    <div
      ref={canvasRef}
      className={styles.canvas}
      style={{
        cursor: dragState ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Paper
        className={styles.page}
        style={{
          width: `${dimensions.pageWidth * zoomFactor}px`,
          height: `${dimensions.pageHeight * zoomFactor}px`,
          backgroundImage: snapToGrid
            ? `
              linear-gradient(0deg, transparent calc(100% - 1px), #e0e0e0 calc(100% - 1px)),
              linear-gradient(90deg, transparent calc(100% - 1px), #e0e0e0 calc(100% - 1px))
            `
            : 'none',
          backgroundSize: `${gridSize * zoomFactor}px ${gridSize * zoomFactor}px`,
          backgroundPosition: `${dimensions.marginLeft * zoomFactor}px ${
            dimensions.marginTop * zoomFactor
          }px`,
        }}
      >
        {/* Page margins indicator */}
        <Box
          className={styles.margins}
          style={{
            left: `${dimensions.marginLeft * zoomFactor}px`,
            top: `${dimensions.marginTop * zoomFactor}px`,
            width: `${dimensions.contentWidth * zoomFactor}px`,
            height: `${dimensions.contentHeight * zoomFactor}px`,
          }}
        >
          {/* Render bands */}
          {report.bands.map((band) => (
            <CanvasBand
              key={band.id}
              band={band}
              zoom={zoomFactor}
              isSelected={selectedObjectId !== undefined}
              onObjectMouseDown={handleObjectMouseDown}
            />
          ))}
        </Box>
      </Paper>
    </div>
  );
};

export default Canvas;
