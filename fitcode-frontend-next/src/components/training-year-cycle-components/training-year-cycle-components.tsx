import { SetState } from '@/common/type/state.type';
import { useGroup } from '@/store/group-provider';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Box, Divider, Typography } from '@mui/material';
import SelectInput from '../select-input/select-input';
import { useTheme } from '@mui/material';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { useScreenSize } from '@/store/screen-size-provider';
import { CommonService } from '@/common/service/common.service';
import { Target } from '@/controller/target/type/target.type';

const commonService = CommonService.instance;

interface CycleComponentsProps {
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  setEditModal: SetState<boolean>;
  setEditCycle: React.Dispatch<React.SetStateAction<Cycle | null>>;
  sortedCycles: Cycle[];
  setSortedCycles: SetState<Cycle[]>;
  sliderProperties: { width: string; centerPosition: string }[];
  setSliderProperties: SetState<{ width: string; centerPosition: string }[]>;
}

export default function CycleComponents(props: CycleComponentsProps) {
  const {
    setEditCycle,
    setEditModal,
    sortedCycles,
    setSortedCycles,
    sliderProperties,
    setSliderProperties,
  } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { setGroup, components, setDetectedChanges } = useGroup();

  const parentComponents = components
    .filter((component) => component.parentId === null)
    .filter((component) => ![WARMUP_ID, COOLDOWN_ID].includes(component.id));

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={3} mt={3}>
      <Divider sx={{ p: 0, m: 0 }} />

      {parentComponents.toReversed().map((component) => {
        const IconComponent = commonService.navigation.getComponentIcon(
          component.name
        );

        return (
          <>
            <Box
              display="flex"
              width="100%"
              sx={{
                alignItems: 'center',
              }}
            >
              <Box
                width="7.25%"
                display="flex"
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  display="flex"
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: theme.palette.background.light,
                    p: 1,
                    px: 0.65,
                    borderRadius: 1,
                  }}
                >
                  <IconComponent
                    sx={{
                      fontSize: screenSize.isMobile ? 20 : 25,
                    }}
                  />
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

                  const targetColor = component.targets?.find(
                    (c) => c.id === selectedTarget?.targetId
                  )?.color;

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
                      <Typography
                        sx={{
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                          color: theme.palette.text.primary,
                          zIndex: 1000,
                        }}
                      >
                        {`${cycle.name}`}
                      </Typography>

                      <Box
                        width="100%"
                        height={5}
                        sx={{
                          backgroundColor: targetColor,
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
                        dissableMinWidth
                        setValue={(value) => {
                          setDetectedChanges(true);

                          if (value === 'None' || !value) {
                            const newCycle: Cycle = {
                              ...cycle,
                              selectedTargets: cycle.selectedTargets.filter(
                                (st) => st.componentId !== component.id
                              ),
                            };

                            const newCycles = sortedCycles.map((c) =>
                              c.id === cycle.id ? newCycle : c
                            );

                            setSortedCycles(newCycles);
                            setGroup((prevGroup) => ({
                              ...prevGroup,
                              cycles: newCycles,
                            }));

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

                          const newCycles = sortedCycles.map((c) =>
                            c.id === cycle.id ? newCycle : c
                          );

                          setSortedCycles(newCycles);
                          setGroup((prevGroup) => ({
                            ...prevGroup,
                            cycles: newCycles,
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </Box>
            </Box>
            <Divider sx={{ p: 0, m: 0 }} />
          </>
        );
      })}
    </Box>
  );
}
