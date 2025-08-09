import { FormControl, InputLabel } from '@mui/material';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import React, { useEffect, useState } from 'react';

import type { Attribute } from '@/controller/attribute/type/attribute.type';

// recursive components to show select for sub attributes
export default function SelectAttribute(props: {
  attribute: Attribute;
  onChange: (field: string, value: string) => void;
  initialValue?: string | Record<string, unknown>;
  label?: boolean;
}) {
  const { attribute, onChange, initialValue, label } = props;
  const [subOptions, setSubOptions] = useState<Attribute | undefined>(
    undefined
  );

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

      const selectedOption = attribute.options?.find(
        (option) =>
          typeof option === 'object' &&
          option.field === initialValue[attribute.field]
      );

      setSubOptions(selectedOption);
    }
  }, [attribute.field, attribute.options, initialValue]);

  function handleSelectChange(e: SelectChangeEvent) {
    const value = e.target.value as string;
    setSelectedValue(value);

    const selectedOption = attribute.options?.find(
      (option) => typeof option === 'object' && option.field === value
    );

    setSubOptions(selectedOption);
    onChange(attribute.field, value);
  }

  return (
    <Box>
      <FormControl fullWidth>
        {label && (
          <InputLabel id={attribute.field}>{attribute.name}</InputLabel>
        )}

        <Select
          labelId={attribute.field}
          label={label ? attribute.name : undefined}
          variant="outlined"
          fullWidth
          value={selectedValue || ''}
          onChange={handleSelectChange}
        >
          <MenuItem value="">None</MenuItem>

          {attribute.options?.map((option) => (
            <MenuItem key={option.field} value={option.field}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {subOptions?.options && (
        <SelectAttribute
          attribute={subOptions}
          onChange={onChange}
          initialValue={initialValue}
        />
      )}
    </Box>
  );
}
