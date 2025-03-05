import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Button, Popover, TextField, Box } from '@mui/material';
import { Component } from '@/controller/component/type/component.type';
import toast from 'react-hot-toast';

interface ComponentType {
  id: string;
  name: string;
  parent: string | null;
}

interface Props {
  components: Component[];
  selectedComponent: Component | null;
  setSelectedComponent: (value: Component | undefined) => void;
}

export default function CycleComponentsSelect({
  label,
  selectedValue,
  components,
  parentId,
  setValue,
}: {
  label: string;
  selectedValue: string;
  components: Component[];
  parentId: string;
  setValue: (value: string) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [subMenuAnchor, setSubMenuAnchor] = useState<null | HTMLElement>(null);
  const [subMenuItems, setSubMenuItems] = useState<Component[]>([]);
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');
  const [children, setChildren] = useState<Component[]>([]);

  useEffect(() => {
    setChildren(components.filter((c) => c.parent === parentId));
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
      const subMenuComponents = components.filter((c) => c.parent === parentId);
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
        {!components.filter((c) => c.parent === parentId).length ? (
          <MenuItem>No child components</MenuItem>
        ) : (
          components
            .filter((c) => c.parent === parentId)
            .map((component) => (
              <MenuItem
                key={component.id}
                onClick={(e) => {
                  const filtered = components.filter(
                    (c) => c.parent === component.id
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
                    (c) => c.parent === component.id
                  );
                  if (filtered.length > 0) {
                    handleSubMenuOpen(e, component.id);
                  }
                }}
              >
                {component.name}{' '}
                {components.filter((c) => c.parent === component.id).length
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
