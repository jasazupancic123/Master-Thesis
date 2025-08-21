import { MoreVert } from '@mui/icons-material';
import { IconButton, Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';

import ExerciseChips from '../exercise-chips/exercise-chips';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorder from '../vertical-lines-border/vertical-lines-border';
import { CommonService } from '@/common/service/common.service';
import {
  handleAddTrainingComponents,
  handleDeleteTrainingComponent,
} from '@/components/trainer-cycle-view/state';
import TrainingWeek from '@/components/training-week/training-week';
import { ComponentService } from '@/controller/component/component.service';
import type { Component } from '@/controller/component/type/component.type';
import { GroupService } from '@/controller/group/group.service';
import type { Target } from '@/controller/target/type/target.type';
import { TrainingService } from '@/controller/training/training.service';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';

const commonService = CommonService.instance;

export default function TrainerCycleView() {
  const { components, exercises: allExercises, methods } = useMain();
  const { group, cycle, setCycle, setTrainings, setDateFrom, setDateTo } =
    useGroup();

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

  useEffect(() => {
    setCyclesForSelect(GroupService.getCyclesForSelect(group.cycles));
  }, [group.cycles]);

  useEffect(() => {
    if (!cycle) return;

    setSelectedTargets(
      cycle.selectedTargets.map((st) => ({
        componentId: st.componentId,
        target: components
          .find((c) => c.id === st.componentId)
          ?.targets?.find((t) => t.id === st.targetId) as Target,
      })) || []
    );
  }, [cycle]);

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

  const HorizontalItems = () => {
    return (
      <HorizontalItemsList
        items={cyclesForSelect}
        noItemsText="No cycles available"
        value={cycle?.id || ''}
        setValue={(value) => {
          setCycle(group.cycles.find((c) => c.id === value) || undefined);
        }}
        onArrowClick={() => {}}
        cycleView
        checkIsSameValue={(value: string) => {
          return value === (cycle?.id || '');
        }}
      />
    );
  };

  return (
    <Box
      pb={10}
      maxWidth={MAX_WIDTH}
      position="relative"
      sx={{
        mx: 'auto',
        minHeight: 'calc(100vh - 50px)',
        overflowY: 'none',
      }}
    >
      <VerticalLinesBorder />

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
              <HorizontalItems />
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
                        ? `${commonService.date.weeks(cycle.from, cycle.to).length} weeks`
                        : 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <>
              <Box width="25%" display="flex" />
              <Box width="50%" display="flex" maxHeight={67}>
                <HorizontalItems />
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
                          ? `${commonService.date.weeks(cycle.from, cycle.to).length} weeks`
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
            gap={screenSize.isReallySmall ? 1.5 : 3.5}
          />
        </Box>
      </Box>

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
            width="100%"
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
            sx={{
              backgroundColor: theme.palette.background.dark,
            }}
          >
            {commonService.date.weeks(cycle.from, cycle.to).map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  week={week.map(({ date }) => dayjs(date!))}
                  selected={selectedComponents}
                  cycleView
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  addTrainingComponent={(trainingId, input) => {
                    handleAddTrainingComponents(
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
