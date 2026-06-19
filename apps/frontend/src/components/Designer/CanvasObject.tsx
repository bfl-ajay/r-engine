/**
 * Canvas Object Component
 * Renders a single report object on the canvas
 */

import React from 'react';
import { Box } from '@mui/material';
import type { ReportObject } from '../../../packages/shared/src/types';
import styles from './CanvasObject.module.css';

interface CanvasObjectProps {
  object: ReportObject;
  zoom: number;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const CanvasObject: React.FC<CanvasObjectProps> = ({
  object,
  zoom,
  onMouseDown,
}) => {
  const renderObjectContent = () => {
    switch (object.type) {
      case 'TEXT':
        return object.text || '[Text]';
      case 'LABEL':
        return object.text || '[Label]';
      case 'FIELD':
        return object.fieldName ? `{${object.fieldName}}` : '[Field]';
      case 'EXPRESSION':
        return object.expression ? `{=${object.expression}}` : '[Expression]';
      case 'IMAGE':
        return (
          <img
            src={object.imageSource}
            alt="Report Image"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        );
      case 'PAGE_NUMBER':
        return '[Page #]';
      case 'TOTAL_PAGES':
        return '[Total Pages]';
      case 'DATE_TIME':
        return '[Date/Time]';
      case 'TABLE':
        return '[Table]';
      case 'MATRIX':
        return '[Matrix]';
      case 'CHART':
        return '[Chart]';
      case 'BARCODE':
        return '[Barcode]';
      case 'QRCODE':
        return '[QR Code]';
      case 'SUBREPORT':
        return '[Subreport]';
      case 'SHAPE':
      case 'LINE':
      default:
        return '';
    }
  };

  return (
    <Box
      className={styles.object}
      style={{
        position: 'absolute',
        left: `${object.position.x * zoom}px`,
        top: `${object.position.y * zoom}px`,
        width: `${object.size.width * zoom}px`,
        height: `${object.size.height * zoom}px`,
        backgroundColor: object.style.backgroundColor || 'transparent',
        borderColor: object.style.borderColor || '#cccccc',
        borderWidth: `${object.style.borderWidth || 1}px`,
        borderStyle: 'solid',
        padding: `${(object.style.padding || 4) * zoom}px`,
        overflow: 'hidden',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${(object.textStyle?.fontSize || 12) * zoom}px`,
        fontFamily: object.textStyle?.fontFamily || 'Arial',
        color: object.textStyle?.color || '#000000',
      }}
      onMouseDown={onMouseDown}
    >
      {renderObjectContent()}
    </Box>
  );
};

export default CanvasObject;
