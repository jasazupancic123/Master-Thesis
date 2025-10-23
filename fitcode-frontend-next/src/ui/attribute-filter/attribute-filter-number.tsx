import { Slider } from '@mui/material';

import type { AttributeFilterProps } from './type';

export default function AttributeFilterNumber(props: AttributeFilterProps) {
  const { attribute, value, onChange } = props;

  return (
    <div style={{ padding: '1rem 0' }}>
      <label style={{ display: 'block', marginBottom: 4 }}>
        {attribute.name} {attribute.unit ? `(${attribute.unit})` : ''}
      </label>

      <Slider
        value={value ?? attribute.min ?? 0}
        min={attribute.min ?? 0}
        max={attribute.max ?? 100}
        step={1}
        onChange={(_, newValue) => onChange(newValue)}
        valueLabelDisplay="auto"
      />
    </div>
  );
}
