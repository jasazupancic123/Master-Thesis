import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import {
  handleAddTrainingComponents,
  handleDeleteTrainingComponent,
} from '@/components/trainer-cycle-view/state';
import TrainingWeek from '@/components/training-week/training-week';
import { useGroup } from '@/store/group-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { TrainingService } from '@/controller/training/training.service';
import { IconButton, Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';
import { useScreenSize } from '@/store/screen-size-provider';
import { Target } from '@/controller/target/type/target.type';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { GroupService } from '@/controller/group/group.service';
import { MoreVert } from '@mui/icons-material';

export default function TrainerCycleView() {
  const {
    token,
    group,
    components,
    exercises: allExercises,
    methods,
    cycle,
    setCycle,
    setTrainings,
    setDateFrom,
    setDateTo,
  } = useGroup();

  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<
    { componentId: string; target: Target }[]
  >([]);
  const [isSticky, setIsSticky] = useState(false);

  const [cyclesForSelect, setCyclesForSelect] = useState<
    { label: string; value: string }[]
  >([]);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setCyclesForSelect(GroupService.getCyclesForSelect(group.cycles));
  }, [startIndex, group.cycles]);

  // effect to track scroll position and set sticky mode
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!cycle) return;

    const newSelectedTargets = [] as { componentId: string; target: Target }[];

    cycle.selectedTargets.map((st) => {
      const component = components.find((c) => c.id === st.componentId);
      if (component) {
        const target = component.targets?.find((t) => t.id === st.targetId);
        if (target) {
          newSelectedTargets.push({
            componentId: st.componentId,
            target,
          });
        }
      }
    });

    setSelectedTargets(newSelectedTargets);
  }, []);

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  return (
    <Box pb={10}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.background.default,
          position: 'relative',
        }}
        gap={1}
      >
        <Box
          width="100%"
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
        >
          {screenSize.isSmallerThanLaptop ? (
            <Box width="100%" display="flex" flexDirection="column">
              <HorizontalItemsList
                items={cyclesForSelect}
                value={cycle?.id || ''}
                setValue={(value) => {
                  setCycle(
                    group.cycles.find((c) => c.id === value) || undefined
                  );
                }}
                onArrowClick={(direction) => {}}
                cycleView
                checkIsSameValue={(value: string) => {
                  return value === (cycle?.id || '');
                }}
              />
              <Box display="flex" justifyContent="center" gap={4} mt={0.75}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      textAlign: 'right',
                    }}
                  >
                    Group
                  </Typography>
                  <Typography
                    textTransform="uppercase"
                    sx={{
                      fontSize: screenSize.isSmallerThanLaptop
                        ? '14px'
                        : '16px',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {group.name}
                  </Typography>
                </Box>
                {cycle && (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '12px',
                        fontWeight: 400,
                        textAlign: 'right',
                      }}
                    >
                      Duration
                    </Typography>
                    <Typography
                      textTransform="uppercase"
                      sx={{
                        fontSize: screenSize.isSmallerThanLaptop
                          ? '14px'
                          : '16px',
                        fontWeight: 600,
                        textAlign: 'right',
                      }}
                    >
                      {cycle.from && cycle.to
                        ? `${Math.ceil(dayjs(cycle.to).diff(dayjs(cycle.from), 'day') / 7)} weeks`
                        : 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <>
              <Box width="25%" display="flex" />
              <Box width="50%" display="flex" maxHeight={70}>
                <HorizontalItemsList
                  items={cyclesForSelect}
                  value={cycle?.id || ''}
                  setValue={(value) => {
                    setCycle(
                      group.cycles.find((c) => c.id === value) || undefined
                    );
                  }}
                  onArrowClick={(direction) => {}}
                  cycleView
                  checkIsSameValue={(value: string) => {
                    return value === (cycle?.id || '');
                  }}
                />
              </Box>
              <Box width="25%" display="flex" justifyContent="flex-end" gap={5}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="flex-end"
                  mt={0.75}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      textAlign: 'right',
                    }}
                  >
                    Group
                  </Typography>
                  <Typography
                    textTransform="uppercase"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {group.name}
                  </Typography>
                  {cycle && (
                    <Box mt={1}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '12px',
                          fontWeight: 400,
                          textAlign: 'right',
                        }}
                      >
                        Duration
                      </Typography>
                      <Typography
                        textTransform="uppercase"
                        sx={{
                          fontSize: '16px',
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        {cycle.from && cycle.to
                          ? `${Math.ceil(dayjs(cycle.to).diff(dayjs(cycle.from), 'day') / 7)} weeks`
                          : 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <IconButton sx={{ p: 0, m: 0, mt: -3 }} disableRipple>
                  <MoreVert fontSize="large" />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          pb={!isSticky ? 1 : 0}
          sx={{
            borderBottomRightRadius: isSticky ? '20px' : 0,
            borderBottomLeftRadius: isSticky ? '20px' : 0,
            borderTopRightRadius: isSticky ? '20px' : 0,
            borderTopLeftRadius: isSticky ? '20px' : 0,
            backgroundColor: theme.palette.background.default,
            position: isSticky ? 'fixed' : undefined,
            top: isSticky ? '70px' : undefined,
            zIndex: 1000,
            px: isSticky ? 0.5 : 0,
            transition: 'top 1s ease-in-out',
            boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
            border: isSticky ? '1px solid grey' : 'none',
          }}
        >
          <ExerciseChips
            components={ComponentService.toTree(
              TrainingService.excludeWarmupCooldown(components)
            )}
            selected={selectedComponents}
            bgColor={theme.palette.background.default}
            primaryColor={theme.palette.primary.main}
            setSelected={(component) =>
              setSelectedComponents(component as Component[])
            }
            cycleView
            selectedTargets={selectedTargets}
            setSelectedTargets={setSelectedTargets}
            gap={4}
          />
        </Box>
      </Box>

      {/* Choose cycle */}
      <Box mb={2} />

      {cycle && (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          mt={2}
          sx={{
            backgroundColor: theme.palette.background.dark,
          }}
        >
          <Box
            width="90%"
            display="flex"
            alignItems="center"
            justifyContent="space-around"
            sx={{
              marginX: 'auto',
              py: 0.5,
            }}
          >
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, j) => (
              <Typography key={j} fontWeight={400} fontSize="12px">
                {day}
              </Typography>
            ))}
          </Box>
          {/* Training weeks */}
          <Stack
            pb={1}
            sx={{
              backgroundColor: theme.palette.background.dark,
            }}
          >
            {cycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  week={week.map(({ date }) => dayjs(date!))}
                  selected={selectedComponents}
                  cycleView
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  addTrainingComponent={(trainingId, input) => {
                    handleAddTrainingComponents(
                      token,
                      { trainingId, ...input },
                      {
                        router,
                        components,
                        setTrainings,
                        exercises: allExercises,
                        selectedTargets,
                        methods,
                      }
                    );
                  }}
                  deleteTrainingComponent={(trainingId, componentId) =>
                    handleDeleteTrainingComponent(
                      token,
                      { trainingId, componentId },
                      {
                        router,
                        setTrainings,
                        components,
                        exercises: allExercises,
                        methods,
                      }
                    )
                  }
                  selectedTargets={selectedTargets}
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
