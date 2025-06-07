import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Popover, TextField, Box } from '@mui/material';
import { Component } from '@/controller/component/type/component.type';
import { useTheme } from '@mui/material';
import { Clear, Remove } from '@mui/icons-material';

interface CycleComponentsSelectProps {
  label: string;
  selectedValue: string;
  rootComponent: Component;
  components: Component[];
  parentId: string;
  setValue: (value: string) => void;
}

export default function CycleComponentsSelect(
  props: CycleComponentsSelectProps
) {
  const {
    label,
    selectedValue,
    rootComponent,
    components,
    parentId,
    setValue,
  } = props;

  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [subMenuAnchor, setSubMenuAnchor] = useState<null | HTMLElement>(null);
  const [subMenuItems, setSubMenuItems] = useState<Component[]>([]);
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');
  const [children, setChildren] = useState<Component[]>([]);

  useEffect(() => {
    setChildren(components.filter((c) => c.parentId === parentId));
  }, [components, parentId, subMenuItems]);

  const handleOpen = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSubMenuAnchor(null);
  };

  const handleSubMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    parentId: string
  ) => {
    if (children.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition(window.innerWidth - rect.right > 200 ? 'right' : 'left');
      const subMenuComponents = components.filter(
        (c) => c.parentId === parentId
      );
      setSubMenuItems(subMenuComponents);
      setSubMenuAnchor(event.currentTarget);
    }
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <TextField label={label} value={selectedValue} onClick={handleOpen} />
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

        {!components.filter((c) => c.parentId === parentId).length ? (
          <MenuItem>No child components</MenuItem>
        ) : (
          components
            .filter((c) => c.parentId === parentId)
            .map((component) => (
              <MenuItem
                key={component.id}
                onClick={(e) => {
                  const filtered = components.filter(
                    (c) => c.parentId === component.id
                  );
                  if (filtered.length > 0) {
                    handleSubMenuOpen(e, component.id);
                  } else {
                    setValue(component.id);
                    handleClose();
                  }
                }}
                onMouseEnter={(e) => {
                  const filtered = components.filter(
                    (c) => c.parentId === component.id
                  );
                  if (filtered.length > 0) {
                    handleSubMenuOpen(e, component.id);
                  }
                }}
              >
                {component.name}{' '}
                {components.filter((c) => c.parentId === component.id).length
                  ? '▶'
                  : ''}
              </MenuItem>
            ))
        )}
      </Menu>

      {/* SubMenu */}
      <Popover
        anchorEl={subMenuAnchor}
        open={Boolean(subMenuAnchor)}
        onClose={() => setSubMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: menuPosition }}
      >
        {subMenuItems.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              setValue(item.id);
              handleClose();
            }}
          >
            {item.name}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}
