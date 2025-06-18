import { CommonService } from '@/common/service/common.service';
import { useScreenSize } from '@/store/screen-size-provider';
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SxProps,
  Tooltip,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import React from 'react';
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
    cycleView,
    selectedTargets,
    setSelectedTargets,
  } = props;

  return (
    <Stack
      direction={direction as any}
      spacing={1}
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
                    width: screenSize.isMobile ? 30 : 50, // Adjust size as needed
                    height: screenSize.isMobile ? 30 : 50, // Adjust size as needed
                    borderRadius: '50%', // Makes it a circle
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
                    sx={{ fontSize: screenSize.isMobile ? 20 : 30 }}
                  />
                </div>
              </Tooltip>
              {cycleView && selectedTargets && setSelectedTargets && (
                <FormControl sx={{ mt: 0.5 }}>
                  <Tooltip
                    title={
                      selectedTargets.find((st) => st.componentId === c.id)
                        ?.target.name || ''
                    }
                  >
                    <Select
                      variant="outlined"
                      value={
                        selectedTargets.find((st) => st.componentId === c.id)
                          ?.target.id || ''
                      }
                      onChange={(e) =>
                        setSelectedTargets((prev) => {
                          const targetId = e.target.value as string;

                          if (targetId === 'none') {
                            return prev.filter((st) => st.componentId !== c.id);
                          }

                          const target =
                            targets && targets.find((t) => t.id === targetId);

                          if (!target) return prev;

                          const existingIndex = prev.findIndex(
                            (sm) => sm.componentId === c.id
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
                        })
                      }
                      sx={{
                        maxWidth: 50,
                        '& .MuiSelect-select': {
                          paddingY: '2px !important',
                        },
                      }}
                    >
                      <MenuItem key={'none'} value={'none'}>
                        None
                      </MenuItem>
                      {targets &&
                        targets.map((target, i) => (
                          <MenuItem key={i} value={target.id}>
                            {target.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </Tooltip>
                </FormControl>
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
