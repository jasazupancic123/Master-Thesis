import React, { useEffect, useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import { FormControl, InputLabel } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import {
  ExerciseAttribute,
  ExerciseAttributeSelectOption,
} from '@/controller/exercise/type/exercise-attribute.type';

// recursive components to show select for sub attributes
export default function SelectAttribute(props: {
  attribute: ExerciseAttribute | ExerciseAttributeSelectOption;
  onChange: (field: string, value: string) => void;
  initialValue?: string | Record<string, any>;
  label?: boolean;
}) {
  const { attribute, onChange, initialValue, label } = props;

  const [subOptions, setSubOptions] = useState<
    ExerciseAttributeSelectOption | undefined
  >(undefined);
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

      const selectedOption = attribute.values?.find(
        (option) =>
          typeof option === 'object' &&
          option.field === initialValue[attribute.field]
      ) as ExerciseAttributeSelectOption;

      setSubOptions(selectedOption);
    }
  }, [attribute.field, attribute.values, initialValue]);

  function handleSelectChange(e: SelectChangeEvent) {
    const value = e.target.value as string;
    setSelectedValue(value);

    const selectedOption = attribute.values?.find(
      (option) => typeof option === 'object' && option.field === value
    ) as ExerciseAttributeSelectOption;

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

          {attribute.values?.map((option) => {
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

      {subOptions && (
        <SelectAttribute
          attribute={subOptions}
          onChange={onChange}
          initialValue={initialValue}
        />
      )}
    </Box>
  );
}
