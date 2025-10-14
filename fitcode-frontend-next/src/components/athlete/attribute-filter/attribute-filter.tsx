import { Checkbox, FormControlLabel, Grid2, TextField } from '@mui/material';
import React from 'react';

import AttributeFilterBoolean from './components/attribute-filter-boolean';
import AttributeFilterNumber from './components/attribute-filter-number';
import AttributeFilterSelect from './components/attribute-filter-select';
import AttributeFilterString from './components/attribute-filter-string';
import type { AttributeFilterProps } from './props/props.type';
import { AttributeType } from '@/controller/attribute/enum/attribute-value.enum';
import type { Attribute } from '@/controller/attribute/type/attribute.type';

export default function AttributeFilter(props: AttributeFilterProps) {
  const { attribute, value, onChange, search } = props;

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
        <Grid2
          container
          spacing={1}
          sx={{
            maxHeight: attribute.leafesOnly ? 300 : undefined,
            overflowY: attribute.leafesOnly ? 'auto' : undefined,
          }}
        >
          {attribute.leafesOnly ? (
            (() => {
              const queue: Attribute<any>[] = [attribute];
              const leafes: Attribute<any>[] = [];

              while (queue.length) {
                const a = queue.shift()!;
                if (a.options && a.options.length > 0) queue.push(...a.options);
                else if (
                  !leafes.find((leaf) => leaf.field === a.field) &&
                  (search && search.length > 0
                    ? a.name.toLowerCase().includes(search.toLowerCase())
                    : true)
                ) {
                  leafes.push(a);
                }
              }

              return leafes.map((leaf) => {
                const prefix = `${leaf.field}`;
                const selectedSubset = new Set(
                  (value as string[] | undefined)?.filter((v) =>
                    v.startsWith(prefix)
                  )
                );

                return (
                  <FormControlLabel
                    key={leaf.field}
                    control={
                      <Checkbox
                        checked={selectedSubset.size > 0}
                        onChange={(e) => {
                          const filtered =
                            (value as string[] | undefined)?.filter(
                              (v) => !v.startsWith(prefix)
                            ) ?? [];

                          if (e.target.checked)
                            onChange([...filtered, leaf.field]);
                          else onChange(filtered);
                        }}
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': { color: 'primary.main' },
                        }}
                      />
                    }
                    label={leaf.name}
                  />
                );
              });
            })()
          ) : (
            <>
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
            </>
          )}
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
