import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import SelectInput from '../select-input/select-input';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { SetState } from '@/common/type/state.type';
import { ComponentLevel } from '@/controller/group/enum/component-level.enum';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Target } from '@/controller/target/type/target.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

interface CycleComponentsProps {
  sortedCycles: Cycle[];
  setSortedCycles: SetState<Cycle[]>;
  sliderProperties: { width: string; centerPosition: string }[];
}

export default function CycleComponents(props: CycleComponentsProps) {
  const { sortedCycles, setSortedCycles, sliderProperties } = props;

  const theme = useTheme();

  const { components } = useMain();
  const { setGroup, setDetectedChanges } = useGroup();

  const parentComponents = components
    .filter((component) => component.parentId === null)
    .filter((component) => ![WARMUP_ID, COOLDOWN_ID].includes(component.id));

  const getComponentLevelColor = (
    componentLevel: ComponentLevel | undefined
  ) => {
    if (!componentLevel) return undefined;

    switch (componentLevel) {
      case ComponentLevel.MAINTENANCE:
        return '#FFA14E';
      case ComponentLevel.DEVELOPMENT:
        return '#A275F7';
      case ComponentLevel.RECOVERY:
        return '#76E36C';
      default:
        return undefined;
    }
  };

  const updateCycleState = (newCycle: Cycle) => {
    const newCycles = sortedCycles.map((c) =>
      c.id === newCycle.id ? newCycle : c
    );

    setSortedCycles(newCycles);

    setGroup((prevGroup) => {
      const newStateCycles = prevGroup.cycles.map(
        (c) => newCycles.find((nc) => nc.id === c.id) || c
      );

      newCycles.forEach((nc) => {
        if (!newStateCycles.some((c) => c.id === nc.id)) {
          newStateCycles.push(nc);
        }
      });

      return {
        ...prevGroup,
        cycles: newStateCycles,
      };
    });
  };

  return (
    <Box width="100%" display="flex" flexDirection="column" position="relative">
      {parentComponents.toReversed().map((component) => {
        return (
          <Box key={component.id} width="100%">
            <Box
              display="flex"
              width="100%"
              sx={{
                alignItems: 'center',
                borderBottom: `1px solid transparent`,
                backgroundImage: `repeating-linear-gradient(
                          to right,
                          ${theme.palette.background.lightBorder} 0,
                          ${theme.palette.background.lightBorder} 6px,
                          transparent 6px,
                          transparent 12px
                        )`,
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'bottom left',
                backgroundSize: '14px 1px', // controls dash+gap
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
                height={4}
                sx={{
                  borderRadius: 2,
                  backgroundColor: theme.palette.text.primary,
                  position: 'relative',
                }}
              >
                {sortedCycles.map((cycle, i) => {
                  const sliderPropety = sliderProperties[i];
                  if (!sliderPropety) return null;

                  // parse number from string
                  let widthNumber = parseFloat(sliderPropety.width);
                  if (isNaN(widthNumber)) return null;

                  widthNumber += 0.5; // Add 0.5% for border radius
                  const width = `${widthNumber}%`;

                  const centerPosition = sliderPropety.centerPosition;

                  const selectedTarget = cycle.selectedTargets.find(
                    (st) => st.componentId === component.id
                  );

                  const componentLevelColor = getComponentLevelColor(
                    selectedTarget?.componentLevel
                  );

                  return (
                    <div
                      key={cycle.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'absolute',
                        left: centerPosition,
                        top: -23,
                        transform: 'translateX(-50%)',
                        width: width,
                        maxWidth: width,
                        gap: 4.5,
                      }}
                    >
                      {selectedTarget && (
                        <SelectInput<ComponentLevel>
                          label=""
                          value={selectedTarget?.componentLevel || ''}
                          icon={<></>}
                          selectedItemSize={12}
                          items={Object.values(ComponentLevel)}
                          itemKey={undefined}
                          itemName={undefined}
                          selectPadding={'0'}
                          maxWidth={'100%'}
                          minWidth={60}
                          setValue={(value) => {
                            setDetectedChanges(true);

                            if (value === 'None' || !value) {
                              const newCycle: Cycle = {
                                ...cycle,
                                selectedTargets: cycle.selectedTargets.map(
                                  (st) =>
                                    st.componentId === component.id
                                      ? {
                                          ...st,
                                          componentLevel: undefined,
                                        }
                                      : st
                                ),
                              };

                              updateCycleState(newCycle);

                              return;
                            }

                            const newSelectedTargets =
                              cycle.selectedTargets.some(
                                (st) => st.componentId === component.id
                              )
                                ? cycle.selectedTargets.map((st) =>
                                    st.componentId === component.id
                                      ? {
                                          ...st,
                                          componentLevel:
                                            value as ComponentLevel,
                                        }
                                      : st
                                  )
                                : [
                                    ...cycle.selectedTargets,
                                    {
                                      componentId: component.id,
                                      targetId: selectedTarget.targetId,
                                      componentLevel: value as ComponentLevel,
                                    },
                                  ];

                            const newCycle: Cycle = {
                              ...cycle,
                              selectedTargets: newSelectedTargets,
                            };

                            updateCycleState(newCycle);
                          }}
                        />
                      )}

                      <Box
                        width="100%"
                        height={5.5}
                        sx={{
                          mt: 0.05,
                          backgroundColor: componentLevelColor,
                          zIndex: 100000,
                          borderRadius: 2,
                        }}
                      />

                      <SelectInput<Target>
                        label=""
                        icon={<></>}
                        selectedItemSize={12}
                        value={selectedTarget?.targetId || ''}
                        items={component.targets || []}
                        itemKey={'id'}
                        itemName={'name'}
                        selectPadding={'0'}
                        maxWidth={'100%'}
                        minWidth={60}
                        sx={{
                          mt: !selectedTarget ? 3 : 0,
                        }}
                        setValue={(value) => {
                          setDetectedChanges(true);

                          if (value === 'None' || !value) {
                            const newCycle: Cycle = {
                              ...cycle,
                              selectedTargets: cycle.selectedTargets.filter(
                                (st) => st.componentId !== component.id
                              ),
                            };

                            updateCycleState(newCycle);

                            return;
                          }

                          const target = component.targets?.find(
                            (c) => c.id === value
                          );

                          if (!target) return;

                          const newSelectedTargets = cycle.selectedTargets.some(
                            (st) => st.componentId === component.id
                          )
                            ? cycle.selectedTargets.map((st) =>
                                st.componentId === component.id
                                  ? {
                                      componentId: component.id,
                                      targetId: target.id,
                                    }
                                  : st
                              )
                            : [
                                ...cycle.selectedTargets,
                                {
                                  componentId: component.id,
                                  targetId: target.id,
                                },
                              ];

                          const newCycle: Cycle = {
                            ...cycle,
                            selectedTargets: newSelectedTargets,
                          };

                          updateCycleState(newCycle);
                        }}
                      />
                    </div>
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
