/**
 * Band Manager Component
 * Manages the bands in the report
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  selectReport,
  selectSelectedBandId,
  addBand,
  deleteBand,
  selectBand,
  updateBand,
} from '../../store/designerSlice';
import { BAND_DISPLAY_NAMES } from '../../../packages/shared/src/utils';
import type { BandType } from '../../../packages/shared/src/types';
import type { AppDispatch } from '../../store';
import styles from './BandManager.module.css';

export const BandManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const report = useSelector(selectReport);
  const selectedBandId = useSelector(selectSelectedBandId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMenuBandId, setSelectedMenuBandId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBandType, setSelectedBandType] = useState<BandType>('DATA');
  const [bandName, setBandName] = useState('');
  const [editingBandId, setEditingBandId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, bandId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuBandId(bandId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuBandId(null);
  };

  const handleAddBandClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddBandConfirm = () => {
    if (bandName.trim()) {
      dispatch(addBand(selectedBandType));
    }
    setAddDialogOpen(false);
    setBandName('');
    setSelectedBandType('DATA');
  };

  const handleEditBandClick = (bandId: string) => {
    const band = report.bands.find(b => b.id === bandId);
    if (band) {
      setEditingBandId(bandId);
      setBandName(band.name);
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditBandConfirm = () => {
    if (editingBandId && bandName.trim()) {
      const band = report.bands.find(b => b.id === editingBandId);
      if (band) {
        dispatch(updateBand({ ...band, name: bandName }));
      }
    }
    setEditDialogOpen(false);
    setBandName('');
    setEditingBandId(null);
  };

  const handleDeleteBand = (bandId: string) => {
    if (window.confirm('Are you sure you want to delete this band?')) {
      dispatch(deleteBand(bandId));
    }
    handleMenuClose();
  };

  const handleToggleBandVisibility = (bandId: string) => {
    const band = report.bands.find(b => b.id === bandId);
    if (band) {
      dispatch(updateBand({ ...band, visible: !band.visible }));
    }
    handleMenuClose();
  };

  return (
    <Box className={styles.bandManager}>
      <Box className={styles.header}>
        <Typography variant="h6">Bands</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddBandClick}
          className={styles.addButton}
        >
          Add
        </Button>
      </Box>

      <List className={styles.bandList}>
        {report.bands.map((band) => (
          <ListItemButton
            key={band.id}
            selected={selectedBandId === band.id}
            onClick={() => dispatch(selectBand(band.id))}
            className={styles.bandItem}
          >
            <ListItemIcon className={styles.bandIcon}>
              {band.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={band.name}
              secondary={BAND_DISPLAY_NAMES[band.type]}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Button
              size="small"
              variant="text"
              onClick={(e) => handleMenuOpen(e, band.id)}
              className={styles.menuButton}
            >
              <MoreVertIcon fontSize="small" />
            </Button>
          </ListItemButton>
        ))}
      </List>

      {/* Band context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedMenuBandId && handleEditBandClick(selectedMenuBandId)}>
          <EditIcon fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedMenuBandId && handleToggleBandVisibility(selectedMenuBandId)}>
          <VisibilityIcon fontSize="small" />
          Toggle Visibility
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedMenuBandId && handleDeleteBand(selectedMenuBandId)}>
          <DeleteIcon fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Add Band Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Band</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Band Type</InputLabel>
              <Select
                value={selectedBandType}
                onChange={(e) => setSelectedBandType(e.target.value as BandType)}
                label="Band Type"
              >
                {Object.entries(BAND_DISPLAY_NAMES).map(([type, displayName]) => (
                  <MenuItem key={type} value={type}>
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Band Name"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="e.g., Custom Data Band"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBandConfirm} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Band Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Band</DialogTitle>
        <DialogContent>
          <TextField
            label="Band Name"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditBandConfirm} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BandManager;
