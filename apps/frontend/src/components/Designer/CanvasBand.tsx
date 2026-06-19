/**
 * Canvas Band Component
 * Renders a single band with its objects
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import type { Band, ReportObject } from '../../../packages/shared/src/types';
import { CanvasObject } from './CanvasObject';
import styles from './CanvasBand.module.css';

interface CanvasBandProps {
  band: Band;
  zoom: number;
  isSelected: boolean;
  onObjectMouseDown: (
    e: React.MouseEvent,
    objectId: string,
    x: number,
    y: number
  ) => void;
}

export const CanvasBand: React.FC<CanvasBandProps> = ({
  band,
  zoom,
  isSelected,
  onObjectMouseDown,
}) => {
  const currentY = 0; // Track vertical position if needed

  return (
    <Tooltip title={`${band.name} (${band.type})`} placement="right">
      <Box
        className={styles.band}
        style={{
          backgroundColor: band.backgroundColor || '#ffffff',
          borderColor: band.borderColor || '#cccccc',
          borderWidth: band.borderWidth || 1,
          borderStyle: 'solid',
          height: `${band.height * zoom}px`,
          paddingTop: `${(band.paddingTop || 0) * zoom}px`,
          paddingBottom: `${(band.paddingBottom || 0) * zoom}px`,
          paddingLeft: `${(band.paddingLeft || 0) * zoom}px`,
          paddingRight: `${(band.paddingRight || 0) * zoom}px`,
          position: 'relative',
          marginBottom: `${1 * zoom}px`,
        }}
      >
        {/* Band label */}
        <div className={styles.bandLabel}>{band.name}</div>

        {/* Render objects in band */}
        {band.children.map((object) => (
          <CanvasObject
            key={object.id}
            object={object}
            zoom={zoom}
            onMouseDown={(e) =>
              onObjectMouseDown(
                e,
                object.id,
                object.position.x,
                object.position.y
              )
            }
          />
        ))}
      </Box>
    </Tooltip>
  );
};

export default CanvasBand;
