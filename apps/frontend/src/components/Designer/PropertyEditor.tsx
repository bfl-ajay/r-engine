/**
 * Property Editor Component
 * Right sidebar for editing selected object/band properties
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
} from '@mui/material';
import {
  selectReport,
  selectSelectedObjectId,
  selectSelectedBandId,
  updateObject,
  updateBand,
} from '../../store/designerSlice';
import { findReportObject, findBand } from '../../../packages/shared/src/utils';
import type { AppDispatch } from '../../store';
import styles from './PropertyEditor.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`property-tabpanel-${index}`}
      aria-labelledby={`property-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const PropertyEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const report = useSelector(selectReport);
  const selectedObjectId = useSelector(selectSelectedObjectId);
  const selectedBandId = useSelector(selectSelectedBandId);
  const [tabValue, setTabValue] = React.useState(0);

  const selectedObject = selectedObjectId ? findReportObject(report, selectedObjectId) : null;
  const selectedBand = selectedBandId ? findBand(report, selectedBandId) : null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!selectedObject && !selectedBand) {
    return (
      <Box className={styles.editor}>
        <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
          Select an object or band to edit properties
        </Typography>
      </Box>
    );
  }

  if (selectedObject) {
    return (
      <Box className={styles.editor}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="property tabs"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="General" id="property-tab-0" aria-controls="property-tabpanel-0" />
          <Tab label="Position/Size" id="property-tab-1" aria-controls="property-tabpanel-1" />
          <Tab label="Style" id="property-tab-2" aria-controls="property-tabpanel-2" />
          <Tab label="Text" id="property-tab-3" aria-controls="property-tabpanel-3" />
        </Tabs>

        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={selectedObject.name}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: { name: e.target.value },
                  })
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Type"
              value={selectedObject.type}
              disabled
              fullWidth
              size="small"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedObject.visible}
                  onChange={(e) =>
                    dispatch(
                      updateObject({
                        objectId: selectedObject.id,
                        updates: { visible: e.target.checked },
                      })
                    )
                  }
                />
              }
              label="Visible"
            />

            {selectedObject.type === 'FIELD' && (
              <TextField
                label="Field Name"
                value={selectedObject.fieldName || ''}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: { fieldName: e.target.value },
                    })
                  )
                }
                fullWidth
                size="small"
              />
            )}

            {selectedObject.type === 'TEXT' && (
              <TextField
                label="Text"
                value={selectedObject.text || ''}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: { text: e.target.value },
                    })
                  )
                }
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            )}
          </Box>
        </TabPanel>

        {/* Position/Size Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="X"
                type="number"
                value={selectedObject.position.x}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: {
                        position: { ...selectedObject.position, x: parseInt(e.target.value) || 0 },
                      },
                    })
                  )
                }
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Y"
                type="number"
                value={selectedObject.position.y}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: {
                        position: { ...selectedObject.position, y: parseInt(e.target.value) || 0 },
                      },
                    })
                  )
                }
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Width"
                type="number"
                value={selectedObject.size.width}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: {
                        size: { ...selectedObject.size, width: parseInt(e.target.value) || 0 },
                      },
                    })
                  )
                }
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Height"
                type="number"
                value={selectedObject.size.height}
                onChange={(e) =>
                  dispatch(
                    updateObject({
                      objectId: selectedObject.id,
                      updates: {
                        size: { ...selectedObject.size, height: parseInt(e.target.value) || 0 },
                      },
                    })
                  )
                }
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>

        {/* Style Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Background Color"
              type="color"
              value={selectedObject.style.backgroundColor || '#ffffff'}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      style: { ...selectedObject.style, backgroundColor: e.target.value },
                    },
                  })
                )
              }
              size="small"
              InputProps={{ style: { height: 40 } }}
            />
            <TextField
              label="Border Color"
              type="color"
              value={selectedObject.style.borderColor || '#cccccc'}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      style: { ...selectedObject.style, borderColor: e.target.value },
                    },
                  })
                )
              }
              size="small"
              InputProps={{ style: { height: 40 } }}
            />
            <TextField
              label="Border Width"
              type="number"
              value={selectedObject.style.borderWidth || 1}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      style: { ...selectedObject.style, borderWidth: parseInt(e.target.value) || 0 },
                    },
                  })
                )
              }
              size="small"
            />
          </Box>
        </TabPanel>

        {/* Text Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Font Family"
              value={selectedObject.textStyle?.fontFamily || 'Arial'}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      textStyle: { ...selectedObject.textStyle, fontFamily: e.target.value },
                    },
                  })
                )
              }
              size="small"
            />
            <TextField
              label="Font Size"
              type="number"
              value={selectedObject.textStyle?.fontSize || 12}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      textStyle: { ...selectedObject.textStyle, fontSize: parseInt(e.target.value) || 12 },
                    },
                  })
                )
              }
              size="small"
            />
            <TextField
              label="Color"
              type="color"
              value={selectedObject.textStyle?.color || '#000000'}
              onChange={(e) =>
                dispatch(
                  updateObject({
                    objectId: selectedObject.id,
                    updates: {
                      textStyle: { ...selectedObject.textStyle, color: e.target.value },
                    },
                  })
                )
              }
              size="small"
              InputProps={{ style: { height: 40 } }}
            />
          </Box>
        </TabPanel>
      </Box>
    );
  }

  if (selectedBand) {
    return (
      <Box className={styles.editor}>
        <Typography variant="subtitle2" sx={{ p: 2, pb: 0, fontWeight: 600 }}>
          Band Properties
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          <TextField
            label="Name"
            value={selectedBand.name}
            onChange={(e) => dispatch(updateBand({ ...selectedBand, name: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="Height (px)"
            type="number"
            value={selectedBand.height}
            onChange={(e) =>
              dispatch(updateBand({ ...selectedBand, height: parseInt(e.target.value) || 40 }))
            }
            fullWidth
            size="small"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedBand.visible}
                onChange={(e) => dispatch(updateBand({ ...selectedBand, visible: e.target.checked }))}
              />
            }
            label="Visible"
          />
          <TextField
            label="Background Color"
            type="color"
            value={selectedBand.backgroundColor || '#ffffff'}
            onChange={(e) =>
              dispatch(updateBand({ ...selectedBand, backgroundColor: e.target.value }))
            }
            size="small"
            InputProps={{ style: { height: 40 } }}
          />
        </Box>
      </Box>
    );
  }

  return null;
};

export default PropertyEditor;
