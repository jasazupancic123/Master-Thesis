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

import { core } from '@/core/core.service';
import type { Attribute } from '@/core/attribute/type/attribute.type';

interface Props {
  attribute: Attribute;
  onChange: (field: string, values: string[]) => void;
  initialValue?: string[];
  label?: boolean;
}

export default function FlatSelectAttribute({
  attribute,
  onChange,
  initialValue = [],
  label,
}: Props) {
  const field = attribute.field as string;
  const flatOptions = useMemo(
    () => core.attribute.flatten(attribute, '', 0, true),
    [attribute]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (event: any) =>
    onChange(field, event.target.value as string[]);

  return (
    <Box>
      <FormControl fullWidth>
        {label && <InputLabel id={field}>{attribute.name}</InputLabel>}

        <Select
          labelId={field}
          multiple
          value={initialValue}
          onChange={handleChange}
          renderValue={(selected) =>
            (selected as string[])
              .map((v) => core.attribute.leaf(attribute, v)?.name ?? v) // show leaf name
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
