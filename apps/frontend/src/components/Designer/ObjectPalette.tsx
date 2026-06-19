/**
 * Object Palette Component
 * Sidebar showing available report objects for drag-and-drop
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Typography,
  Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { getObjectCategories, OBJECT_DISPLAY_NAMES } from '../../../packages/shared/src/utils';
import type { ReportObjectType } from '../../../packages/shared/src/types';
import { selectSelectedBandId, addObject } from '../../store/designerSlice';
import type { AppDispatch } from '../../store';
import styles from './ObjectPalette.module.css';

export const ObjectPalette: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedBandId = useSelector(selectSelectedBandId);
  const categories = getObjectCategories();
  const [expandedCategory, setExpandedCategory] = useState<string>('Text & Data');

  const handleAddObject = (objectType: ReportObjectType) => {
    if (!selectedBandId) {
      alert('Please select a band first');
      return;
    }

    dispatch(addObject({ bandId: selectedBandId, objectType }));
  };

  return (
    <Box className={styles.palette}>
      <Typography variant="h6" className={styles.title}>
        Object Palette
      </Typography>
      <Divider />

      {Object.entries(categories).map(([category, objects]) => (
        <Accordion
          key={category}
          expanded={expandedCategory === category}
          onChange={() => setExpandedCategory(category)}
          className={styles.category}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{category}</Typography>
          </AccordionSummary>
          <AccordionDetails className={styles.categoryDetails}>
            <Box className={styles.objectList}>
              {objects.map((objectType: any) => (
                <Button
                  key={objectType}
                  fullWidth
                  variant="outlined"
                  size="small"
                  className={styles.objectButton}
                  onClick={() => handleAddObject(objectType)}
                  disabled={!selectedBandId}
                >
                  {OBJECT_DISPLAY_NAMES[objectType]}
                </Button>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ObjectPalette;
