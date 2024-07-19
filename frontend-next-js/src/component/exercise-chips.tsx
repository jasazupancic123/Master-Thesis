import { Chip } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';
import { Component } from '@/type/component.type';

interface Props {
  selected: Component;
  components: Component[]
  onClick: (component: Component | null) => void
}

export default function ExerciseChips(props: Props) {
  const { selected, components, onClick } = props

  return <Stack direction="row" spacing={1} flexWrap="wrap">
    <Chip
      key={''}
      label='All'
      variant='outlined'
      onClick={() => onClick(null)}
    />

    {components.map((c) => <Chip
      key={c.id}
      label={c.name}
      variant={selected?.id === c.id ? 'filled' : 'outlined' as any}
      onClick={() => onClick(c)}
    />)}
  </Stack>
}