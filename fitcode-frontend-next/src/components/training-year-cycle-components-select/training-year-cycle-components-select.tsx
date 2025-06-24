import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Popover, TextField, Box } from '@mui/material';
import { Component } from '@/controller/component/type/component.type';
import { useTheme } from '@mui/material';
import { Clear } from '@mui/icons-material';

interface CycleComponentsSelectProps {
  label: string;
  selectedValue: string;
  component: Component;
  setValue: (value: string) => void;
}

export default function CycleComponentsSelect(
  props: CycleComponentsSelectProps
) {
  const { label, selectedValue, component, setValue } = props;

  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <TextField
          label={label}
          value={selectedValue}
          onClick={handleOpen}
          inputProps={{ readOnly: true }}
          autoComplete="off"
        />
      </Box>

      {/* Main Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          key="remove"
          onClick={() => setValue('Remove')}
          sx={{ color: theme.palette.error.main }}
        >
          <Clear sx={{ color: theme.palette.error.main, pl: 0, ml: 0 }} />{' '}
          Remove
        </MenuItem>

        {!component.targets || !component.targets.length ? (
          <MenuItem>No targets</MenuItem>
        ) : (
          component.targets.map((target) => (
            <MenuItem
              key={target.id}
              onClick={(e) => {
                setValue(target.id);
                handleClose();
              }}
            >
              {target.name}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
