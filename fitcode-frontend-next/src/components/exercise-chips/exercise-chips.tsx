import type { SxProps } from '@mui/material';
import { Box, MenuItem, Select, SvgIcon, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';

import { theme } from '@/app/style';
import { Components } from '@/core/exercise/constant/components.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Component } from '@/core/exercise/type/component.type';
import type { Target } from '@/core/exercise/type/target.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  noSelectionLabel?: string; // for all / no selection
  selected?: null | Component | Component[];
  setSelected?: SetState<Props['selected']>;
  disableNoSelection?: boolean;
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
  disabledComponents?: string[]; // list of component fields to disable
}

export default function ExerciseChips({
  selected,
  setSelected,
  disableNoSelection,
  direction = 'row',
  primaryColor,
  gap,
  cycleView,
  selectedTargets,
  setSelectedTargets,
  disabledComponents,
  sx,
}: Props) {
  const screenSize = useScreenSize();

  return (
    <Stack
      direction={direction}
      spacing={gap !== undefined ? gap : 1}
      flexWrap="wrap"
      sx={{ justifyContent: 'center', alignItems: 'center', ...sx }}
    >
      {Components.filter((c) => !disabledComponents?.includes(c.field)).map(
        (c, i) => {
          const IconComponent = lib.common.component.getIcon(c.name);
          const targets = Targets.filter((t) => t.componentId === c.field);

          const isSelected =
            (Array.isArray(selected) &&
              selected.some((component) => component.field === c.field)) ||
            (selected &&
              !Array.isArray(selected) &&
              selected.field === c.field);

          return (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              key={c.field}
            >
              <Box sx={{ pb: 0.5 }} key={c.field}>
                <div
                  key={i}
                  onClick={() => {
                    if (cycleView && setSelectedTargets) {
                      if (
                        Array.isArray(selected) &&
                        setSelected &&
                        selectedTargets
                      ) {
                        if (
                          selected.some(
                            (component) => component.field === c.field
                          )
                        )
                          setSelected(
                            selected.filter(
                              (component) => component.field !== c.field
                            )
                          );
                        else setSelected([...selected, c]);
                      }
                      return;
                    }

                    if (!setSelected) return;

                    if (Array.isArray(selected)) {
                      if (
                        selected.some(
                          (component) => component.field === c.field
                        )
                      ) {
                        setSelected(
                          selected.filter(
                            (component) => component.field !== c.field
                          )
                        );

                        setSelectedTargets?.((prev) =>
                          prev.filter((st) => st.componentId !== c.field)
                        );
                      } else setSelected([...selected, c]);
                    } else {
                      if (selected?.field === c.field && !disableNoSelection)
                        setSelected(null);
                      else setSelected(c);
                    }
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: screenSize.isMobile ? 30 : 38,
                    height: screenSize.isMobile ? 30 : 50,
                    borderRadius: '15px',
                    border: `2px solid ${
                      isSelected ? primaryColor : 'transparent'
                    }`,
                    cursor: 'pointer',
                    backgroundColor:
                      (Array.isArray(selected) &&
                        selected.some(
                          (component) => component.field === c.field
                        )) ||
                      (selected &&
                        !Array.isArray(selected) &&
                        selected.field === c.field)
                        ? theme.palette.primary.main
                        : 'transparent',
                  }}
                >
                  {IconComponent && (
                    <SvgIcon
                      component={IconComponent as React.ElementType} // handles SvgIconComponent or your SvgC
                      inheritViewBox
                      sx={{
                        fontSize: screenSize.isMobile ? 20 : 26,
                        color: isSelected
                          ? theme.palette.background.default
                          : undefined,
                        // force shapes inside the svg to use currentColor
                        '& path, & rect, & circle, & polygon, & ellipse, & line, & polyline':
                          {
                            fill: 'currentColor',
                            stroke: 'currentColor',
                          },
                      }}
                    />
                  )}
                </div>
              </Box>
              {cycleView && selectedTargets && setSelectedTargets ? (
                <Select
                  variant="standard"
                  value={
                    selectedTargets?.find((st) => st.componentId === c.field)
                      ?.target.field || 'none'
                  }
                  onChange={(e) => {
                    if (
                      Array.isArray(selected) &&
                      setSelected &&
                      !selected.some((component) => component.field === c.field)
                    )
                      setSelected([...selected, c]);

                    const targetId = e.target.value;
                    if (targetId === 'none') {
                      setSelectedTargets?.((prev) =>
                        prev.filter((st) => st.componentId !== c.field)
                      );
                      return;
                    }

                    const target = targets.find((t) => t.field === targetId);
                    if (!target) return;

                    setSelectedTargets?.((prev) => {
                      const existingIndex = prev.findIndex(
                        (st) => st.componentId === c.field
                      );

                      if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                          componentId: c.field,
                          target,
                        };

                        return updated;
                      }

                      return [...prev, { componentId: c.field, target }];
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
                        p: '0px',
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
                    <MenuItem
                      key={target.field as string}
                      value={target.field as string}
                    >
                      {target.name}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    width: screenSize.isMobile ? 30 : 80,
                    textAlign: 'center',
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
        }
      )}
    </Stack>
  );
}
