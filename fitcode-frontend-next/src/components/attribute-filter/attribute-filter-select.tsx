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

import type { Attribute } from '@/controller/attribute/type/attribute.type';
import { ExerciseAttributeService } from '@/controller/exercise/exercise-attribute.service';

interface AttributeDropdownProps {
  attributes: Attribute[];
  label: string;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

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
    onChange(
      ExerciseAttributeService.toggleSelection(selected, key, attributes)
    );

  const renderAttribute = (attr: Attribute, parentKey?: string, level = 0) => {
    const key = parentKey ? `${parentKey}:${attr.field}` : attr.field;
    const state = ExerciseAttributeService.getSelectionState(
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
