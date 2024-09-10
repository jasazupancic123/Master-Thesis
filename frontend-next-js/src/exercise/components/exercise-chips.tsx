import { Chip, SxProps } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';
import { Component } from '@/component/type/component.type';

interface Props {
  components: Component[];
  noSelectionLabel?: string; // for all / no selection
  selected?: Component | Component[];
  setSelected?: (component: Component | Component[]) => void;
  small?: boolean;
  direction?: 'row' | 'column';
  itemSx?: SxProps;
  sx?: SxProps;
}

export default function ExerciseChips(props: Props) {
  const { selected, noSelectionLabel, components, setSelected, small = false, direction = 'row' } = props;

  return <Stack direction={direction as any} spacing={1} flexWrap="wrap" sx={props.sx}>
    {selected && <Chip
      key={''}
      label={noSelectionLabel}
      color="secondary"
      variant={!selected ? 'filled' : 'outlined' as any}
      size={small ? 'small' : 'medium' as any}
      onClick={() => {
        if (!setSelected)
          return;

        if (Array.isArray(selected))
          setSelected([]);
        else
          setSelected(null as Component);
      }}
      sx={props.itemSx}
    />}

    {components.map((c, i) => <Chip
      key={i}
      label={c.name}
      sx={props.itemSx}
      variant={
        !selected ? 'outlined' :
          Array.isArray(selected)
            ? selected.find(component => component.id === c.id)
              ? 'filled' : 'outlined' as any
            : selected?.id === c.id ? 'filled' : 'outlined' as any}
      onClick={() => {
        if (!setSelected)
          return;

        if (Array.isArray(selected)) {
          if (selected.find(component => component.id === c.id))
            // if components already selected, deselect it
            setSelected(selected.filter(component => component.id !== c.id));
          else
            // if components not selected, select it
            setSelected([...selected, c]);
        } else {
          // if components already selected, deselect it
          if (selected?.id === c.id)
            setSelected(null as Component);
          // if components not selected, select it
          else
            setSelected(c);
        }
      }}
      size={small ? 'small' : 'medium' as any}
    />)}
  </Stack>;
}