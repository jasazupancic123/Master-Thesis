import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { Fragment } from 'react';

import { updateCycleState } from './actions/actions-cycle';
import { useMultiCycleSliderCyclesProvider } from './context/cycles.provider';
import type { UseSliderPropertiesReturnType } from './hooks/use-slider-properties';
import TrainingYearCycleComponentSelectItem from './training-year-cycle-component-select-item';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Target } from '@/core/exercise/type/target.type';
import { CycleLevel } from '@/core/group/enum/cycle-level.enum';
import type { Cycle } from '@/core/group/type/cycle.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import SelectInput from '@/ui/select-input/select-input';

interface CycleComponentsProps {
  useSliderProperties: UseSliderPropertiesReturnType;
}

export default function CycleComponents(props: CycleComponentsProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const groupContext = useGroup();
  const { setDetectedChanges } = groupContext;

  const sortedCyclesContext = useMultiCycleSliderCyclesProvider();
  const { sortedCycles } = sortedCyclesContext;
  const { sliderProperties } = props.useSliderProperties;

  return (
    <Box width="100%" display="flex" flexDirection="column" position="relative">
      {Components.toReversed().map((component) => {
        return (
          <Box key={component.field} width="100%">
            <Box
              display="flex"
              width="100%"
              sx={{
                alignItems: 'center',
                overflowY: 'auto',
              }}
            >
              <Box
                width="7.25%"
                display="flex"
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '140px',
                }}
              >
                <Box
                  display="flex"
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    textAlign="center"
                    sx={{
                      display: 'flex',
                      textTransform: 'uppercase',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      transform: 'rotate(180deg)',
                    }}
                  >
                    {component.name}
                  </Typography>
                </Box>
              </Box>
              <Box
                width="87.9%"
                sx={{
                  position: 'relative',
                }}
              >
                {sortedCycles.map((cycle, i) => {
                  const sliderProperty = sliderProperties[i];
                  if (!sliderProperty) return null;

                  // parse number from string
                  let widthNumber = parseFloat(sliderProperty.width);
                  if (isNaN(widthNumber)) return null;

                  widthNumber += 0.5; // Add 0.5% for border radius
                  const width = `${widthNumber}%`;

                  const centerPosition = sliderProperty.centerPosition;
                  const selectedTarget = cycle.targets.find((st) =>
                    core.training.component.findByTarget(
                      st.targetId,
                      component.field
                    )
                  );

                  const center = parseFloat(sliderProperty.centerPosition); // e.g. "37.5%" -> 37.5
                  const rightEdge = center + widthNumber / 2;
                  const cycleZIndex = i + 2; // later items paint above earlier ones

                  return (
                    <Fragment key={cycle.id}>
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="flex-start"
                        sx={{
                          minHeight: '135px',
                          position: 'absolute',
                          left: centerPosition,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: width,
                          maxWidth: width,
                          backgroundColor: theme.palette.background.light,
                          zIndex: cycleZIndex + 2, // later items paint above earlier ones
                          borderLeft: '1px solid transparent',
                          borderRight: '1px solid transparent',

                          backgroundImage: `
                          repeating-linear-gradient(
                            to bottom,
                            ${theme.palette.background.lightBorder} 0,
                            ${theme.palette.background.lightBorder} 6px,
                            transparent 6px,
                            transparent 12px
                          ),
                          repeating-linear-gradient(
                            to bottom,
                            ${theme.palette.background.lightBorder} 0,
                            ${theme.palette.background.lightBorder} 6px,
                            transparent 6px,
                            transparent 12px
                          )
                        `,
                          backgroundRepeat: 'repeat-y, repeat-y',
                          backgroundPosition: 'left top, right top',
                          backgroundSize: '1px 14px, 1px 14px', // 1px thickness, 6px dash + 6px gap
                        }}
                      >
                        <Box
                          width={width}
                          display="flex"
                          flexDirection="column"
                          alignItems="flex-start"
                          justifyContent="flex-start"
                          sx={{
                            pl: 1,
                          }}
                        >
                          <TrainingYearCycleComponentSelectItem label="Target">
                            <SelectInput<Target>
                              label={''}
                              placeholder={
                                selectedTarget?.targetId
                                  ? 'None'
                                  : 'Select target'
                              }
                              displayEmpty
                              icon={<></>}
                              selectedItemSize={12}
                              value={selectedTarget?.targetId || ''}
                              items={Targets.filter(
                                (t) => t.componentId === component.field
                              )}
                              itemKey={'field'}
                              itemName={'name'}
                              selectPadding={'0'}
                              maxWidth={'100%'}
                              minWidth={100}
                              alignToStart
                              selectSx={
                                selectedTarget
                                  ? {
                                      color: theme.palette.primary.main,
                                      textTransform: 'uppercase',
                                      fontSize: screenSize.isMobile ? 12 : 16,
                                      fontWeight: 'bold',
                                    }
                                  : {}
                              }
                              setValue={(value) => {
                                setDetectedChanges(true);

                                if (value === 'None' || !value) {
                                  const newCycle: Cycle = {
                                    ...cycle,
                                    targets: cycle.targets.filter((st) =>
                                      core.training.component.findByTarget(
                                        st.targetId,
                                        component.field
                                      )
                                    ),
                                  };

                                  updateCycleState(
                                    { newCycle },
                                    {
                                      useGroup: groupContext,
                                      useSliderCycles: sortedCyclesContext,
                                    }
                                  );

                                  return;
                                }

                                const target =
                                  core.training.component.findTarget(
                                    value as string
                                  );

                                if (!target) return;

                                const newSelectedTargets = cycle.targets.some(
                                  (st) =>
                                    core.training.component.findByTarget(
                                      st.targetId,
                                      component.field
                                    )
                                )
                                  ? cycle.targets.map((st) =>
                                      core.training.component.findByTarget(
                                        st.targetId,
                                        component.field
                                      )
                                        ? {
                                            componentId: component.field,
                                            targetId: target!.field as string,
                                          }
                                        : st
                                    )
                                  : [
                                      ...cycle.targets,
                                      {
                                        componentId: component.field,
                                        targetId: target.field as string,
                                      },
                                    ];

                                const newCycle: Cycle = {
                                  ...cycle,
                                  targets: newSelectedTargets,
                                };

                                updateCycleState(
                                  { newCycle },
                                  {
                                    useGroup: groupContext,
                                    useSliderCycles: sortedCyclesContext,
                                  }
                                );
                              }}
                            />
                          </TrainingYearCycleComponentSelectItem>

                          {selectedTarget && (
                            <TrainingYearCycleComponentSelectItem label="Objective">
                              <SelectInput<CycleLevel>
                                label=""
                                placeholder="Select objective"
                                displayEmpty
                                value={selectedTarget?.level || ''}
                                icon={<></>}
                                selectedItemSize={12}
                                items={Object.values(CycleLevel)}
                                itemKey={undefined}
                                itemName={undefined}
                                selectPadding={'0'}
                                maxWidth={'100%'}
                                minWidth={60}
                                alignToStart
                                selectSx={
                                  selectedTarget?.level
                                    ? {
                                        fontSize: screenSize.isMobile ? 12 : 16,
                                        fontWeight: 'bold',
                                      }
                                    : {}
                                }
                                setValue={(value) => {
                                  setDetectedChanges(true);

                                  if (value === 'None' || !value) {
                                    const newCycle: Cycle = {
                                      ...cycle,
                                      targets: cycle.targets.map((st) =>
                                        core.training.component.findByTarget(
                                          st.targetId,
                                          component.field
                                        )
                                          ? { ...st, level: undefined }
                                          : st
                                      ),
                                    };

                                    updateCycleState(
                                      { newCycle },
                                      {
                                        useGroup: groupContext,
                                        useSliderCycles: sortedCyclesContext,
                                      }
                                    );

                                    return;
                                  }

                                  const newSelectedTargets = cycle.targets.some(
                                    (st) =>
                                      core.training.component.findByTarget(
                                        st.targetId,
                                        component.field
                                      )
                                  )
                                    ? cycle.targets.map((st) =>
                                        core.training.component.findByTarget(
                                          st.targetId,
                                          component.field
                                        )
                                          ? {
                                              ...st,
                                              level: value as CycleLevel,
                                            }
                                          : st
                                      )
                                    : [
                                        ...cycle.targets,
                                        {
                                          componentId: component.field,
                                          targetId: selectedTarget.targetId,
                                          componentLevel: value as CycleLevel,
                                        },
                                      ];

                                  const newCycle: Cycle = {
                                    ...cycle,
                                    targets: newSelectedTargets,
                                  };

                                  updateCycleState(
                                    { newCycle },
                                    {
                                      useGroup: groupContext,
                                      useSliderCycles: sortedCyclesContext,
                                    }
                                  );
                                }}
                              />
                            </TrainingYearCycleComponentSelectItem>
                          )}
                        </Box>
                      </Box>
                      {(() => {
                        // Middle gaps: current → next
                        if (i < sortedCycles.length - 1) {
                          const spNext = sliderProperties[i + 1];
                          if (!spNext) return null;

                          let nextW = parseFloat(spNext.width);
                          if (isNaN(nextW)) return null;
                          nextW += 0.5;

                          const nextCenter = parseFloat(spNext.centerPosition);
                          const nextLeft = nextCenter - nextW / 2;

                          const gapWidth = nextLeft - rightEdge; // %
                          if (gapWidth <= 0) return null;

                          const gapCenter = rightEdge + gapWidth / 2;

                          return (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${gapCenter}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: `${gapWidth}%`,
                                height: '100%',
                                minHeight: '135px',
                                zIndex: cycleZIndex + 1, // between current and next
                                backgroundColor:
                                  theme.palette.background.default,
                                pointerEvents: 'none',
                              }}
                            />
                          );
                        }

                        // Last gap: last cycle → container end (100%)
                        const gapWidthToEnd = 100 - rightEdge; // %
                        if (gapWidthToEnd <= 0) return null;

                        const gapCenterToEnd = rightEdge + gapWidthToEnd / 2;

                        return (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${gapCenterToEnd}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: `${gapWidthToEnd}%`,
                              height: '100%',
                              minHeight: '135px',
                              zIndex: cycleZIndex + 1, // just above last cycle
                              backgroundColor: theme.palette.background.default,
                              pointerEvents: 'none',
                            }}
                          />
                        );
                      })()}
                    </Fragment>
                  );
                })}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
