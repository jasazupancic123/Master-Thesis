import {
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import React, { useState } from 'react';

import type { AttributeDropdownProps } from './type';
import { app } from '@/core/app.service';
import type { Attribute } from '@/core/attribute/type/attribute.type';

export default function AttributeFilterSelect({
  attributes,
  label,
  selected,
  onChange,
}: AttributeDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => setAnchorEl(null);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);

  const handleToggle = (key: string) =>
    onChange(app.exercise.attribute.toggleSelection(selected, key, attributes));

  const renderAttribute = (attr: Attribute, parentKey?: string, level = 0) => {
    const field = attr.field as string;
    const key = parentKey ? `${parentKey}:${field}` : field;
    const state = app.exercise.attribute.getSelectionState(
      selected,
      key,
      attributes
    );

    return (
      <Box key={key}>
        <MenuItem sx={{ pl: 2 + level * 2 }} onClick={() => handleToggle(key)}>
          <Checkbox
            checked={state === 'checked'}
            indeterminate={state === 'indeterminate'}
          />
          <ListItemText primary={attr.name} />
        </MenuItem>

        {attr.options?.map((child) => renderAttribute(child, key, level + 1))}
      </Box>
    );
  };

  return (
    <FormControl>
      <InputLabel shrink>{label}</InputLabel>
      <Button
        variant="outlined"
        onClick={handleOpen}
        sx={{ textTransform: 'none' }}
      >
        {selected.size > 0 ? `${selected.size} selected` : 'Select...'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{ zIndex: 1500 }}
      >
        {attributes.map((attr) => renderAttribute(attr))}
      </Menu>
    </FormControl>
  );
}
