/**
 * SortingPanel Component
 * UI for configuring report sorting in the designer
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
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
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { AdvancedSortingConfiguration, SortFieldConfiguration, SortDefinitionEx } from '@reporting-engine/shared';
import styles from './SortingPanel.module.css';

interface SortingPanelProps {
  sorting?: AdvancedSortingConfiguration;
  availableFields: string[];
  onSortingChange: (sorting: AdvancedSortingConfiguration) => void;
}

interface SortFieldEditor {
  field: string;
  direction: 'ASC' | 'DESC';
  customComparator?: string;
}

/**
 * SortingPanel - Configure report sorting
 */
export const SortingPanel: React.FC<SortingPanelProps> = ({
  sorting,
  availableFields,
  onSortingChange,
}) => {
  const [sortingConfig, setSortingConfig] = useState<AdvancedSortingConfiguration>(
    sorting || {
      enabled: false,
      allowUserSorting: true,
      defaultSort: [],
      multiLevelSort: true,
      sortFields: [],
    }
  );

  const [editingSortField, setEditingSortField] = useState<SortFieldEditor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleSorting = (enabled: boolean) => {
    const updated = { ...sortingConfig, enabled };
    setSortingConfig(updated);
    onSortingChange(updated);
  };

  const handleToggleAllowUserSorting = (allow: boolean) => {
    const updated = { ...sortingConfig, allowUserSorting: allow };
    setSortingConfig(updated);
    onSortingChange(updated);
  };

  const handleToggleMultiLevelSort = (allow: boolean) => {
    const updated = { ...sortingConfig, multiLevelSort: allow };
    setSortingConfig(updated);
    onSortingChange(updated);
  };

  const handleAddSortField = () => {
    setEditingSortField({
      field: availableFields[0] || '',
      direction: 'ASC',
      customComparator: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSaveSortField = () => {
    if (!editingSortField || !editingSortField.field) return;

    const newSorting = { ...sortingConfig };
    const sortField: SortFieldConfiguration = {
      field: editingSortField.field,
      allowSort: true,
      direction: editingSortField.direction,
      customComparator: editingSortField.customComparator || undefined,
    };

    newSorting.sortFields = [...(newSorting.sortFields || []), sortField];
    newSorting.defaultSort = [
      ...(newSorting.defaultSort || []),
      { field: editingSortField.field, direction: editingSortField.direction },
    ];

    setSortingConfig(newSorting);
    onSortingChange(newSorting);
    setIsDialogOpen(false);
    setEditingSortField(null);
  };

  const handleRemoveSortField = (index: number) => {
    const updated = { ...sortingConfig };
    const removedField = updated.sortFields?.[index];

    updated.sortFields = updated.sortFields?.filter((_, i) => i !== index) || [];
    updated.defaultSort = updated.defaultSort?.filter(
      (s) => s.field !== removedField?.field
    ) || [];

    setSortingConfig(updated);
    onSortingChange(updated);
  };

  const handleMoveSortField = (fromIndex: number, toIndex: number) => {
    if (!sortingConfig.sortFields) return;
    if (toIndex < 0 || toIndex >= sortingConfig.sortFields.length) return;

    const updated = { ...sortingConfig };
    const [removed] = updated.sortFields!.splice(fromIndex, 1);
    updated.sortFields!.splice(toIndex, 0, removed);

    setSortingConfig(updated);
    onSortingChange(updated);
  };

  const handleToggleSortDirection = (index: number) => {
    if (!sortingConfig.sortFields) return;

    const updated = { ...sortingConfig };
    const field = updated.sortFields[index];
    field.direction = field.direction === 'ASC' ? 'DESC' : 'ASC';

    // Update default sort
    const defaultSortIndex = updated.defaultSort?.findIndex(
      (s) => s.field === field.field
    );
    if (defaultSortIndex !== undefined && defaultSortIndex >= 0) {
      updated.defaultSort![defaultSortIndex].direction = field.direction;
    }

    setSortingConfig(updated);
    onSortingChange(updated);
  };

  return (
    <Box className={styles.sortingPanel}>
      <Card>
        <CardHeader
          title="Sorting Configuration"
          subheader="Configure default sort order and multi-level sorting"
        />
        <Divider />
        <CardContent>
          {/* Enable Sorting */}
          <FormControlLabel
            control={
              <Checkbox
                checked={sortingConfig.enabled}
                onChange={(e) => handleToggleSorting(e.target.checked)}
              />
            }
            label="Enable Sorting"
          />

          {sortingConfig.enabled && (
            <>
              {/* Sorting Options */}
              <Box sx={{ mt: 3, mb: 3, pl: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sortingConfig.allowUserSorting ?? true}
                      onChange={(e) =>
                        handleToggleAllowUserSorting(e.target.checked)
                      }
                    />
                  }
                  label="Allow User Sorting (at runtime)"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sortingConfig.multiLevelSort ?? true}
                      onChange={(e) =>
                        handleToggleMultiLevelSort(e.target.checked)
                      }
                    />
                  }
                  label="Multi-Level Sort"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Sort Fields */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Sort Fields</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={handleAddSortField}
                  >
                    Add Field
                  </Button>
                </Box>

                {!sortingConfig.sortFields || sortingConfig.sortFields.length === 0 ? (
                  <Typography color="textSecondary" variant="body2">
                    No sort fields configured
                  </Typography>
                ) : (
                  <List>
                    {sortingConfig.sortFields.map((field, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={field.field}
                          secondary={`Sort: ${field.direction}${
                            field.customComparator ? ' (custom)' : ''
                          }`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleToggleSortDirection(index)}
                            size="small"
                            title={`Switch to ${
                              field.direction === 'ASC' ? 'DESC' : 'ASC'
                            }`}
                          >
                            <SwapVertIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleMoveSortField(index, index - 1)
                            }
                            disabled={index === 0}
                            size="small"
                            title="Move up"
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleMoveSortField(index, index + 1)
                            }
                            disabled={
                              index === (sortingConfig.sortFields?.length || 0) - 1
                            }
                            size="small"
                            title="Move down"
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSortField(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Sort Preview */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Default Sort Order:
                </Typography>
                <Typography variant="body2">
                  {sortingConfig.defaultSort && sortingConfig.defaultSort.length > 0
                    ? sortingConfig.defaultSort
                        .map((s) => `${s.field} (${s.direction})`)
                        .join(' → ')
                    : 'No default sort configured'}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Sort Field Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Sort Field</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Select
              value={editingSortField?.field || ''}
              onChange={(e) =>
                setEditingSortField({
                  ...editingSortField!,
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
              value={editingSortField?.direction || 'ASC'}
              onChange={(e) =>
                setEditingSortField({
                  ...editingSortField!,
                  direction: e.target.value as 'ASC' | 'DESC',
                })
              }
              label="Sort Direction"
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>

            <TextField
              label="Custom Comparator (JavaScript)"
              multiline
              rows={3}
              value={editingSortField?.customComparator || ''}
              onChange={(e) =>
                setEditingSortField({
                  ...editingSortField!,
                  customComparator: e.target.value,
                })
              }
              placeholder="return a.localeCompare(b);"
              helperText="Optional: JavaScript function body for custom sorting"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSortField} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SortingPanel;
