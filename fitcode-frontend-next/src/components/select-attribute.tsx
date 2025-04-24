import { Attribute } from '@/controller/attribute/type/attribute.type';
import { FormControl, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React, { useEffect, useState } from 'react';

// recursive components to show select for sub attributes
export default function SelectAttribute(props: {
  attribute: Attribute;
  onChange: (field: string, value: string) => void;
  initialValue?: string | Record<string, any>;
}) {
  const { attribute, onChange, initialValue } = props;

  const [selectedValue, setSelectedValue] = useState<string | undefined>(() => {
    if (typeof initialValue === 'object')
      return initialValue[attribute.field] as string;

    return initialValue as string;
  });

  /**
   * Populate initial values for nested select
   */
  useEffect(() => {
    if (typeof initialValue === 'object' && initialValue[attribute.field]) {
      setSelectedValue(initialValue[attribute.field] as string);
    }
  }, [attribute.field, attribute.options, initialValue]);

  function handleSelectChange(e: SelectChangeEvent) {
    const value = e.target.value as string;
    setSelectedValue(value);
    onChange(attribute.field, value);
  }

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id={attribute.field}>{attribute.name}</InputLabel>
        <Select
          labelId={attribute.field}
          label={attribute.name}
          variant="outlined"
          fullWidth
          value={selectedValue || ''}
          onChange={handleSelectChange}
        >
          <MenuItem value="">None</MenuItem>

          {attribute.options?.map((option) => {
            if (typeof option === 'string')
              return (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              );

            // nested select
            return (
              <MenuItem key={option.field} value={option.field}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
