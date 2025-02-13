import { getComponentIcon } from '@/common/service/util/components-icon.util';
import { SetState } from '@/common/type/state.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { SvgIconComponent } from '@mui/icons-material';
import { Box, Chip, Icon, SxProps, Toolbar, Tooltip } from '@mui/material';
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
  bgColor?: string;
  primaryColor?: string;
}

export default function ExerciseChips(props: Props) {
  const {
    selected,
    noSelectionLabel,
    components,
    setSelected,
    small = false,
    direction = 'row',
    bgColor,
    primaryColor,
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
      {components.map((c, i) => {
        const IconComponent: SvgIconComponent = getComponentIcon(c.name);

        return (
          <Box sx={{ p: 1 }}>
            <Tooltip key={i} title={c.name} sx={{ m: 2 }}>
              <div
                key={i}
                onClick={() => {
                  if (!setSelected) return;

                  if (Array.isArray(selected)) {
                    if (selected.some((component) => component.id === c.id)) {
                      setSelected(
                        selected.filter((component) => component.id !== c.id)
                      );
                    } else {
                      setSelected([...selected, c]);
                    }
                  } else {
                    setSelected(selected?.id === c.id ? null : c);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50, // Adjust size as needed
                  height: 50, // Adjust size as needed
                  borderRadius: '50%', // Makes it a circle
                  border: `2px solid ${Array.isArray(selected) && selected.some((component) => component.id === c.id) ? primaryColor : 'gray'}`,
                  cursor: 'pointer',
                  backgroundColor:
                    Array.isArray(selected) &&
                    selected.some((component) => component.id === c.id)
                      ? bgColor
                      : 'transparent',
                }}
              >
                <IconComponent sx={{ fontSize: 30 }} />
              </div>
            </Tooltip>
          </Box>
        );
      })}
    </Stack>
  );
}
