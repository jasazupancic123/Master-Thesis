import type { SxProps } from '@mui/material';
import { Box, MenuItem, Select, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';

import { theme } from '@/app/style';
import { getComponentIcon } from '@/common/service/util/icons.util';
import type { SetState } from '@/common/type/state.type';
import type {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import type { Target } from '@/controller/target/type/target.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useScreenSize } from '@/store/screen-size.provider';

export interface ExerciseChipsProps {
  components: (Component | TreeComponent)[];
  noSelectionLabel?: string; // for all / no selection
  selected?:
    | null
    | Component
    | TreeComponent
    | TrainingComponent
    | (Component | TreeComponent | TrainingComponent)[];
  setSelected?: SetState<ExerciseChipsProps['selected']>;
  small?: boolean;
  direction?: 'row' | 'column';
  itemSx?: SxProps;
  sx?: SxProps;
  bgColor?: string;
  primaryColor?: string;
  type?: 'single' | 'multiple';
  cycleView?: boolean; // used in cycle view to show only components with methods
  selectedTargets?: { componentId: string; target: Target }[];
  setSelectedTargets?: SetState<{ componentId: string; target: Target }[]>;
  gap?: number; // gap between chips
}

export default function ExerciseChips(props: ExerciseChipsProps) {
  const screenSize = useScreenSize();
  const {
    selected,
    components,
    setSelected,
    direction = 'row',
    bgColor,
    primaryColor,
    gap,
    cycleView,
    selectedTargets,
    setSelectedTargets,
  } = props;

  return (
    <Stack
      direction={direction}
      spacing={gap !== undefined ? gap : 1}
      flexWrap="wrap"
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...props.sx,
      }}
    >
      {components.map((c, i) => {
        const IconComponent = getComponentIcon(c.name);

        const targets = c.targets || [];

        return (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            key={c.id}
          >
            <Box sx={{ p: 1 }} key={c.id}>
              <div
                key={i}
                onClick={() => {
                  if (cycleView && setSelectedTargets) {
                    if (
                      Array.isArray(selected) &&
                      setSelected &&
                      selectedTargets
                    ) {
                      if (selected.some((component) => component.id === c.id)) {
                        setSelected(
                          selected.filter((component) => component.id !== c.id)
                        );
                      } else {
                        setSelected([...selected, c]);
                      }
                    }
                    return;
                  }

                  if (!setSelected) return;

                  if (Array.isArray(selected)) {
                    if (selected.some((component) => component.id === c.id)) {
                      setSelected(
                        selected.filter((component) => component.id !== c.id)
                      );
                      if (setSelectedTargets) {
                        setSelectedTargets((prev) => {
                          return prev.filter((st) => st.componentId !== c.id);
                        });
                      }
                    } else {
                      setSelected([...selected, c]);
                    }
                  } else {
                    setSelected(selected?.id === c.id ? null : c);
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: screenSize.isMobile ? 30 : 50,
                  height: screenSize.isMobile ? 30 : 50,
                  borderRadius: '5px',
                  border: `2px solid ${
                    (Array.isArray(selected) &&
                      selected.some((component) => component.id === c.id)) ||
                    (selected &&
                      !Array.isArray(selected) &&
                      selected.id === c.id)
                      ? primaryColor
                      : 'gray'
                  }`,
                  cursor: 'pointer',
                  backgroundColor:
                    (Array.isArray(selected) &&
                      selected.some((component) => component.id === c.id)) ||
                    (selected &&
                      !Array.isArray(selected) &&
                      selected.id === c.id)
                      ? bgColor
                      : 'transparent',
                }}
              >
                {IconComponent && (
                  <IconComponent
                    style={{
                      height: screenSize.isMobile ? 20 : 30,
                      width: screenSize.isMobile ? 20 : 30,
                    }}
                  />
                )}
              </div>
            </Box>
            {cycleView && selectedTargets && setSelectedTargets ? (
              <Select
                variant="standard"
                value={
                  selectedTargets?.find((st) => st.componentId === c.id)?.target
                    .id || 'none'
                }
                onChange={(e) => {
                  if (
                    Array.isArray(selected) &&
                    setSelected &&
                    !selected.some((component) => component.id === c.id)
                  ) {
                    setSelected([...selected, c]);
                  }

                  const targetId = e.target.value;
                  if (targetId === 'none') {
                    setSelectedTargets?.((prev) =>
                      prev.filter((st) => st.componentId !== c.id)
                    );
                    return;
                  }

                  const target = targets.find((t) => t.id === targetId);
                  if (!target) return;

                  setSelectedTargets?.((prev) => {
                    const existingIndex = prev.findIndex(
                      (st) => st.componentId === c.id
                    );
                    if (existingIndex !== -1) {
                      const updated = [...prev];
                      updated[existingIndex] = { componentId: c.id, target };
                      return updated;
                    }
                    return [...prev, { componentId: c.id, target }];
                  });
                }}
                sx={{
                  minWidth: screenSize.isMobile ? 30 : 50,
                  fontSize: screenSize.isMobile ? 10 : 12,
                  mt: 0.5,
                  '&.MuiInputBase-root': {
                    mt: 0,
                    width: screenSize.isMobile ? 50 : 90,
                    textAlign: 'center',
                    'svg.MuiSvgIcon-root': {
                      fontSize: 15,
                      color: theme.palette.text.primary,
                    },
                    '&.MuiInput-underline': {
                      border: 'none', // hide underline
                    },
                    'div.MuiSelect-select': {
                      pr: 1.5,
                    },
                  },
                  '&.MuiInputBase-root::before': {
                    borderBottom: 'none',
                  },
                  '&.MuiInputBase-root::after': {
                    borderBottom: 'none',
                  },
                  '&:hover': {
                    borderBottom: 'none',
                  },
                }}
              >
                <MenuItem value="none">{c.name}</MenuItem>
                {targets.map((target) => (
                  <MenuItem key={target.id} value={target.id}>
                    {target.name}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  textAlign: 'center',
                  maxWidth: screenSize.isMobile ? 50 : 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: screenSize.isMobile ? 10 : 12,
                }}
              >
                {c.name}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
