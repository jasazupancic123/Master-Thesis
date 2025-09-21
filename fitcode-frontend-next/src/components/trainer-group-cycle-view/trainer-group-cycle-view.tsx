import { Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';

import ExerciseChips from '../exercise-chips/exercise-chips';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import MobileDoubleTextItems from '../mobile-double-text-items/mobile-double-text-items';
import { DIVIDER_HEIGHT, MAX_WIDTH } from '../trainer-day-view/constant';
import VerticalLinesBorders from '../vertical-lines-borders/vertical-lines-borders';
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
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import CustomDivider from '../custom-divider/custom-divider';

const commonService = CommonService.instance;

export default function TrainerCycleView() {
  const { components, exercises: allExercises, methods } = useMain();
  const { group, cycle, setCycle, setTrainings, setDateFrom, setDateTo } =
    useGroup();

  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const auth = useAuthenticatedAuth();
  const controller = TrainingController.getInstance(auth.token);

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
        sx={
          {
            // py: '0px !important',
          }
        }
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
        px: 3,
      }}
    >
      <VerticalLinesBorders />

      <Box
        display="flex"
        flexDirection="column"
        justifyContent="space-around"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.background.default,
          position: 'relative',
        }}
        height={!screenSize.isSmallerThanLaptop ? DIVIDER_HEIGHT : undefined}
      >
        <Box
          width="100%"
          display="flex"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
        >
          {screenSize.isSmallerThanLaptop ? (
            <Box width="100%" display="flex" flexDirection="column">
              <HorizontalItems />
            </Box>
          ) : (
            <>
              <Box width="25%"></Box>
              <Box width="50%" display="flex" maxHeight={67}>
                <HorizontalItems />
              </Box>
              <Box width="25%"></Box>
            </>
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
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
            pt: isSticky ? 0.5 : 0,
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

      {!screenSize.isSmallerThanLaptop && <CustomDivider />}

      {cycle && (
        <Box width="100%" display="flex" flexDirection="column">
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="space-around"
            sx={{
              py: 1,
            }}
          >
            {(screenSize.isMobile || screenSize.isSmallTablet
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              : [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ]
            ).map((day, j) => (
              <Typography
                key={j}
                width="calc(100% / 7)"
                fontSize={14}
                fontWeight={400}
                textAlign="center"
                sx={{
                  mx: 'auto',
                }}
              >
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
                      controller,
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
                      controller,
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
