import { TextField } from '@mui/material';

import type { AttributeFilterProps } from './props.type';

export default function AttributeFilterString(props: AttributeFilterProps) {
  const { attribute, value, onChange } = props;

  return (
    <TextField
      fullWidth
      label={attribute.name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ htmlInput: { pattern: attribute.pattern ?? undefined } }}
      helperText={attribute.pattern ? `Pattern: ${attribute.pattern}` : ''}
    />
  );
}
