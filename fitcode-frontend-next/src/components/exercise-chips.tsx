import { SetState } from '@/common/type/state.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { Chip, SxProps } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';

interface Props {
  components: (Component | TreeComponent)[];
  noSelectionLabel?: string; // for all / no selection
  selected?: null | Component | TreeComponent | (Component | TreeComponent)[];
  setSelected?: SetState<Props['selected']>;
  small?: boolean;
  direction?: 'row' | 'column';
  itemSx?: SxProps;
  sx?: SxProps;
}

export default function ExerciseChips(props: Props) {
  const {
    selected,
    noSelectionLabel,
    components,
    setSelected,
    small = false,
    direction = 'row',
  } = props;

  return (
    <Stack
      direction={direction as any}
      spacing={1}
      flexWrap="wrap"
      sx={{
        alignItems: 'center',
        ...props.sx,
      }}
    >
      {selected && (
        <Chip
          key={''}
          label={noSelectionLabel}
          color="secondary"
          variant={!selected ? 'filled' : ('outlined' as any)}
          size={small ? 'small' : ('medium' as any)}
          onClick={() => {
            if (!setSelected) return;

            if (Array.isArray(selected)) setSelected([]);
            else setSelected(null);
          }}
          sx={props.itemSx}
        />
      )}

      {components.map((c, i) => (
        <Chip
          key={i}
          label={c.name}
          sx={props.itemSx}
          variant={
            !selected
              ? 'outlined'
              : Array.isArray(selected)
              ? selected.find((component) => component.id === c.id)
                ? 'filled'
                : ('outlined' as any)
              : selected?.id === c.id
              ? 'filled'
              : ('outlined' as any)
          }
          onClick={() => {
            if (!setSelected) return;

            if (Array.isArray(selected)) {
              if (selected.find((component) => component.id === c.id))
                // if components already selected, deselect it
                setSelected(
                  selected.filter((component) => component.id !== c.id)
                );
              // if components not selected, select it
              else setSelected([...selected, c]);
            } else {
              // if components already selected, deselect it
              if (selected?.id === c.id) setSelected(null);
              // if components not selected, select it
              else setSelected(c);
            }
          }}
          size={small ? 'small' : ('medium' as any)}
        />
      ))}
    </Stack>
  );
}
