import { CommonService } from '@/common/service/common.service';
import { useScreenSize } from '@/store/screen-size-provider';
import {
  Box,
  FormControl,
  Menu,
  MenuItem,
  Select,
  SxProps,
  Tooltip,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import React, { useState } from 'react';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { SetState } from '@/common/type/state.type';
import { Target } from '@/controller/target/type/target.type';

const commonService = CommonService.instance;

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

  const [anchorElMap, setAnchorElMap] = useState<
    Record<string, HTMLElement | null>
  >({});

  return (
    <Stack
      direction={direction as any}
      spacing={gap !== undefined ? gap : 1}
      flexWrap="wrap"
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...props.sx,
      }}
    >
      {components.map((c, i) => {
        const IconComponent = commonService.navigation.getComponentIcon(c.name);

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
                onClick={(e) => {
                  if (cycleView && setSelectedTargets) {
                    if (
                      Array.isArray(selected) &&
                      setSelected &&
                      selectedTargets
                    ) {
                      if (c.targets?.length === 0) {
                        if (
                          !selected.some((component) => component.id === c.id)
                        ) {
                          setSelected([...selected, c]);
                        } else {
                          setSelected(
                            selected.filter(
                              (component) => component.id !== c.id
                            )
                          );
                        }
                        return;
                      } else if (
                        selected.some((component) => component.id === c.id)
                      ) {
                        setSelected(
                          selected.filter((component) => component.id !== c.id)
                        );
                        setSelectedTargets((prev) =>
                          prev.filter((st) => st.componentId !== c.id)
                        );

                        return;
                      }
                    }

                    setAnchorElMap((prev) => ({
                      ...prev,
                      [c.id]: e.currentTarget,
                    }));
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
                <IconComponent
                  sx={{
                    fontSize: screenSize.isMobile ? 20 : 30,
                  }}
                />

                {cycleView && selectedTargets && setSelectedTargets && (
                  <FormControl
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)', // center over the icon
                      width: screenSize.isMobile ? 20 : 50,
                      height: screenSize.isMobile ? 20 : 50,
                      zIndex: 2,
                      '& .MuiSelect-icon': {
                        display: 'none', // hide default chevron
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none', // no outline
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                    }}
                  >
                    <Menu
                      anchorEl={anchorElMap[c.id]}
                      open={Boolean(anchorElMap[c.id])}
                      onClose={() =>
                        setAnchorElMap((prev) => ({
                          ...prev,
                          [c.id]: null,
                        }))
                      }
                    >
                      <MenuItem
                        value="none"
                        onClick={() => {
                          if (
                            selectedTargets &&
                            !selectedTargets.some(
                              (st) => st.componentId === c.id
                            ) &&
                            setSelected &&
                            Array.isArray(selected)
                          ) {
                            setSelected([...selected, c]);
                            setAnchorElMap((prev) => ({
                              ...prev,
                              [c.id]: null,
                            }));
                            return;
                          }

                          setSelectedTargets?.((prev) =>
                            prev.filter((st) => st.componentId !== c.id)
                          );
                          setAnchorElMap((prev) => ({
                            ...prev,
                            [c.id]: null,
                          }));
                        }}
                      >
                        None
                      </MenuItem>
                      {targets.map((target, i) => (
                        <MenuItem
                          key={i}
                          selected={selectedTargets?.some(
                            (st) =>
                              st.componentId === c.id &&
                              st.target.id === target.id
                          )}
                          onClick={() => {
                            setSelectedTargets?.((prev) => {
                              const existingIndex = prev.findIndex(
                                (st) => st.componentId === c.id
                              );
                              if (existingIndex !== -1) {
                                const updated = [...prev];
                                updated[existingIndex] = {
                                  componentId: c.id,
                                  target,
                                };
                                return updated;
                              }
                              return [...prev, { componentId: c.id, target }];
                            });

                            if (
                              Array.isArray(selected) &&
                              setSelected &&
                              !selected.some(
                                (component) => component.id === c.id
                              )
                            ) {
                              setSelected([...selected, c]);
                            }

                            setAnchorElMap((prev) => ({
                              ...prev,
                              [c.id]: null,
                            }));
                          }}
                        >
                          {target.name}
                        </MenuItem>
                      ))}
                    </Menu>
                  </FormControl>
                )}
              </div>
            </Box>
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                maxWidth: screenSize.isMobile ? 50 : 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', // <-- 👈 key to force single line!
                fontSize: screenSize.isMobile ? 10 : 12,
              }}
            >
              {selectedTargets?.find((st) => st.componentId === c.id)?.target
                .name || c.name}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
