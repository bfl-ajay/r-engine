/**
 * GroupingPanel Component
 * UI for configuring report grouping in the designer
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { GroupingConfiguration, GroupField, SubtotalDefinition } from '@reporting-engine/shared';
import styles from './GroupingPanel.module.css';

interface GroupingPanelProps {
  grouping?: GroupingConfiguration;
  availableFields: string[];
  onGroupingChange: (grouping: GroupingConfiguration) => void;
}

interface GroupFieldEditor {
  field: string;
  sortOrder: 'ASC' | 'DESC';
  breakOnChange?: boolean;
  keepTogether?: boolean;
}

/**
 * GroupingPanel - Configure report grouping
 */
export const GroupingPanel: React.FC<GroupingPanelProps> = ({
  grouping,
  availableFields,
  onGroupingChange,
}) => {
  const [groupingConfig, setGroupingConfig] = useState<GroupingConfiguration>(
    grouping || {
      enabled: false,
      groupingFields: [],
      subtotals: [],
      showGroupHeader: true,
      showGroupFooter: true,
    }
  );

  const [editingGroupField, setEditingGroupField] = useState<GroupFieldEditor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleGrouping = (enabled: boolean) => {
    const updated = { ...groupingConfig, enabled };
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleAddGroupField = () => {
    setEditingGroupField({
      field: availableFields[0] || '',
      sortOrder: 'ASC',
      breakOnChange: false,
      keepTogether: false,
    });
    setIsDialogOpen(true);
  };

  const handleSaveGroupField = () => {
    if (!editingGroupField || !editingGroupField.field) return;

    const newGrouping = { ...groupingConfig };
    const groupField: GroupField = {
      field: editingGroupField.field,
      name: editingGroupField.field,
      sortOrder: editingGroupField.sortOrder,
      breakOnChange: editingGroupField.breakOnChange,
      keepTogether: editingGroupField.keepTogether,
    };

    newGrouping.groupingFields = [...newGrouping.groupingFields, groupField];

    setGroupingConfig(newGrouping);
    onGroupingChange(newGrouping);
    setIsDialogOpen(false);
    setEditingGroupField(null);
  };

  const handleRemoveGroupField = (index: number) => {
    const updated = { ...groupingConfig };
    updated.groupingFields = updated.groupingFields.filter((_, i) => i !== index);
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleMoveGroupField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= groupingConfig.groupingFields.length) return;

    const updated = { ...groupingConfig };
    const [removed] = updated.groupingFields.splice(fromIndex, 1);
    updated.groupingFields.splice(toIndex, 0, removed);

    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleAddSubtotal = () => {
    // Simplified - would open dialog for full subtotal configuration
    const newSubtotal: SubtotalDefinition = {
      id: `subtotal_${Date.now()}`,
      name: 'Sum',
      field: availableFields[0] || '',
      function: 'SUM',
      placement: 'FOOTER',
    };

    const updated = { ...groupingConfig };
    updated.subtotals = [...(updated.subtotals || []), newSubtotal];
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleRemoveSubtotal = (id: string) => {
    const updated = { ...groupingConfig };
    updated.subtotals = (updated.subtotals || []).filter((s) => s.id !== id);
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleToggleShowGroupHeader = (show: boolean) => {
    const updated = { ...groupingConfig, showGroupHeader: show };
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  const handleToggleShowGroupFooter = (show: boolean) => {
    const updated = { ...groupingConfig, showGroupFooter: show };
    setGroupingConfig(updated);
    onGroupingChange(updated);
  };

  return (
    <Box className={styles.groupingPanel}>
      <Card>
        <CardHeader
          title="Grouping Configuration"
          subheader="Configure data grouping and subtotals"
        />
        <Divider />
        <CardContent>
          {/* Enable Grouping */}
          <FormControlLabel
            control={
              <Checkbox
                checked={groupingConfig.enabled}
                onChange={(e) => handleToggleGrouping(e.target.checked)}
              />
            }
            label="Enable Grouping"
          />

          {groupingConfig.enabled && (
            <>
              {/* Group Fields */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Grouping Fields</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={handleAddGroupField}
                  >
                    Add Field
                  </Button>
                </Box>

                {groupingConfig.groupingFields.length === 0 ? (
                  <Typography color="textSecondary" variant="body2">
                    No grouping fields configured
                  </Typography>
                ) : (
                  <List>
                    {groupingConfig.groupingFields.map((field, index) => (
                      <ListItem key={index}>
                        <DragIndicatorIcon sx={{ mr: 1, color: 'action.disabled' }} />
                        <ListItemText
                          primary={field.field}
                          secondary={`Sort: ${field.sortOrder}${field.breakOnChange ? ' | Page Break' : ''}${
                            field.keepTogether ? ' | Keep Together' : ''
                          }`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleMoveGroupField(index, index - 1)
                            }
                            disabled={index === 0}
                            size="small"
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleMoveGroupField(index, index + 1)
                            }
                            disabled={
                              index === groupingConfig.groupingFields.length - 1
                            }
                            size="small"
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveGroupField(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Group Header/Footer Display */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Display Options
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={groupingConfig.showGroupHeader ?? true}
                      onChange={(e) => handleToggleShowGroupHeader(e.target.checked)}
                    />
                  }
                  label="Show Group Header"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={groupingConfig.showGroupFooter ?? true}
                      onChange={(e) =>
                        handleToggleShowGroupFooter(e.target.checked)
                      }
                    />
                  }
                  label="Show Group Footer"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Subtotals */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Subtotals</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={handleAddSubtotal}
                  >
                    Add Subtotal
                  </Button>
                </Box>

                {!groupingConfig.subtotals || groupingConfig.subtotals.length === 0 ? (
                  <Typography color="textSecondary" variant="body2">
                    No subtotals configured
                  </Typography>
                ) : (
                  <List>
                    {groupingConfig.subtotals.map((subtotal) => (
                      <ListItem key={subtotal.id}>
                        <ListItemText
                          primary={subtotal.name}
                          secondary={`${subtotal.function} of ${subtotal.field} (${subtotal.placement})`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSubtotal(subtotal.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Group Field Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGroupField ? 'Edit Group Field' : 'Add Group Field'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Select
              value={editingGroupField?.field || ''}
              onChange={(e) =>
                setEditingGroupField({
                  ...editingGroupField!,
                  field: e.target.value,
                })
              }
              label="Field"
            >
              {availableFields.map((field) => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={editingGroupField?.sortOrder || 'ASC'}
              onChange={(e) =>
                setEditingGroupField({
                  ...editingGroupField!,
                  sortOrder: e.target.value as 'ASC' | 'DESC',
                })
              }
              label="Sort Order"
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>

            <FormControlLabel
              control={
                <Checkbox
                  checked={editingGroupField?.breakOnChange ?? false}
                  onChange={(e) =>
                    setEditingGroupField({
                      ...editingGroupField!,
                      breakOnChange: e.target.checked,
                    })
                  }
                />
              }
              label="Page Break on Change"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={editingGroupField?.keepTogether ?? false}
                  onChange={(e) =>
                    setEditingGroupField({
                      ...editingGroupField!,
                      keepTogether: e.target.checked,
                    })
                  }
                />
              }
              label="Keep Group Together"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveGroupField} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupingPanel;
