import {
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from '@mui/material';
import { useMemo } from 'react';

import type { Attribute } from '@/controller/attribute/type/attribute.type';

function flattenAttributes(
  attribute: Attribute,
  parentPath = '',
  depth = 0,
  isRoot = false
): { value: string; label: string; depth: number; isLeaf: boolean }[] {
  const currentPath = isRoot
    ? parentPath // skip root id
    : parentPath
      ? `${parentPath}:${attribute.field}`
      : attribute.field;

  if (!attribute.options || attribute.options.length === 0) {
    // Leaf node
    return [
      {
        value: currentPath,
        label: attribute.name,
        depth,
        isLeaf: true,
      },
    ];
  }

  return [
    {
      value: currentPath,
      label: attribute.name,
      depth,
      isLeaf: false,
    },
    ...attribute.options.flatMap((opt) =>
      flattenAttributes(opt, currentPath, depth + 1)
    ),
  ];
}

function findLeafAttribute(
  root: Attribute,
  path: string
): Attribute | undefined {
  const segments = path.split(':');
  let current: Attribute | undefined = root;

  for (let i = 0; i < segments.length; i++) {
    if (!current?.options) return undefined;

    current = current.options.find((opt) => opt.field === segments[i]);
    if (!current) return undefined;
  }

  return current;
}

export default function FlatSelectAttribute(props: {
  attribute: Attribute;
  onChange: (field: string, values: string[]) => void;
  initialValue?: string[];
  label?: boolean;
}) {
  const { attribute, onChange, initialValue = [], label } = props;
  const flatOptions = useMemo(
    () => flattenAttributes(attribute, '', 0, true),
    [attribute]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (event: any) => {
    onChange(attribute.field, event.target.value as string[]);
  };

  return (
    <Box>
      <FormControl fullWidth>
        {label && (
          <InputLabel id={attribute.field}>{attribute.name}</InputLabel>
        )}

        <Select
          labelId={attribute.field}
          multiple
          value={initialValue}
          onChange={handleChange}
          renderValue={(selected) =>
            (selected as string[])
              .map((v) => findLeafAttribute(attribute, v)?.name ?? v) // show leaf name
              .join(', ')
          }
        >
          {flatOptions.map((opt) => (
            <MenuItem
              key={opt.value}
              value={opt.value}
              disabled={!opt.isLeaf} // only leaves selectable
              sx={{ pl: 1.5 + opt.depth * 3 }} // indent by depth
            >
              {opt.isLeaf && (
                <Checkbox checked={initialValue.indexOf(opt.value) > -1} />
              )}

              <ListItemText primary={opt.label} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
