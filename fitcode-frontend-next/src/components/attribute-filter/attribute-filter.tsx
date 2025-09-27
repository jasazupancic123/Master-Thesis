import { Checkbox, FormControlLabel, Grid2, TextField } from '@mui/material';
import React from 'react';

import AttributeFilterBoolean from './attribute-filter-boolean';
import AttributeFilterNumber from './attribute-filter-number';
import AttributeFilterSelect from './attribute-filter-select';
import AttributeFilterString from './attribute-filter-string';
import type { AttributeFilterProps } from './props.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';

export default function AttributeFilter(props: AttributeFilterProps) {
  const { attribute, value, onChange } = props;

  switch (attribute.type) {
    case AttributeType.String:
      return <AttributeFilterString {...props} />;
    case AttributeType.Boolean:
      return <AttributeFilterBoolean {...props} />;
    case AttributeType.Number:
      return <AttributeFilterNumber {...props} />;
    case AttributeType.Select:
    case AttributeType.Multiselect:
      return (
        <Grid2 container spacing={1}>
          {attribute.options?.map((option) => {
            const prefix = `${option.field}`;
            const selectedSubset = new Set(
              (value as string[] | undefined)?.filter((v) =>
                v.startsWith(prefix)
              )
            );

            // If leaf node: render as checkbox
            if (!option.options || option.options.length === 0) {
              return (
                <FormControlLabel
                  key={option.field}
                  control={
                    <Checkbox
                      checked={selectedSubset.size > 0}
                      onChange={(e) => {
                        const filtered =
                          (value as string[] | undefined)?.filter(
                            (v) => !v.startsWith(prefix)
                          ) ?? [];

                        if (e.target.checked)
                          onChange([...filtered, option.field]);
                        else onChange(filtered);
                      }}
                      sx={{
                        color: 'primary.main',
                        '&.Mui-checked': { color: 'primary.main' },
                      }}
                    />
                  }
                  label={option.name}
                />
              );
            }

            // Non-leaf node: render dropdown tree
            return (
              <AttributeFilterSelect
                key={option.field}
                attributes={[option]}
                label={option.name}
                selected={selectedSubset}
                onChange={(next) => {
                  const filtered =
                    (value as string[] | undefined)?.filter(
                      (v) => !v.startsWith(prefix)
                    ) ?? [];

                  onChange([...filtered, ...Array.from(next)]);
                }}
              />
            );
          })}
        </Grid2>
      );
    default:
      return (
        <TextField
          fullWidth
          label={attribute.name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
