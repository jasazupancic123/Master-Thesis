import { Checkbox, FormControlLabel } from '@mui/material';

import type { AttributeFilterProps } from '../props/props.type';

export default function AttributeFilterBoolean(props: AttributeFilterProps) {
  const { attribute, value, onChange } = props;

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label={attribute.name}
    />
  );
}
