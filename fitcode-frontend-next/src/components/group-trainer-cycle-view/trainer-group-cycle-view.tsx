import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import SelectInput from '@/components/select-input/select-input';
import {
  handleAddTrainingComponents,
  handleDeleteTrainingComponent,
} from '@/components/trainer-cycle-view/state';
import TrainingWeek from '@/components/training-week/training-week';
import { useGroup } from '@/store/group-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { TrainingService } from '@/controller/training/training.service';
import { RotateRight, Save } from '@mui/icons-material';
import { IconButton, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';
import { useScreenSize } from '@/store/screen-size-provider';
import FloatingButton from '@/components/floating-button/floating-button';
import { handleSaveGroup } from '../../app/groups/[group_id]/state';
import { Target } from '@/controller/target/type/target.type';

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
    setFilteredTrainings,
    setDateFrom,
    setDateTo,
    setGroup,
    setDetectedChanges,
  } = useGroup();

  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<
    { componentId: string; target: Target }[]
  >([]);
  const [isSticky, setIsSticky] = useState(false);

  // effect to track scroll position and set sticky mode
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  return (
    <>
      {screenSize.isSmallerThanLaptop ? (
        <IconButton
          onClick={() =>
            handleSaveGroup(
              group,
              setGroup,
              cycle,
              setCycle,
              setDetectedChanges,
              token,
              router
            )
          }
          sx={{ p: 0, ml: 2, position: 'fixed', bottom: 30, right: 30 }}
        >
          <Save
            sx={{
              mr: 0,
              cursor: 'pointer',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '50%',
              p: 1,
              fontSize: 40,
            }}
          />
        </IconButton>
      ) : (
        <FloatingButton
          label="Save group"
          onClick={() =>
            handleSaveGroup(
              group,
              setGroup,
              cycle,
              setCycle,
              setDetectedChanges,
              token,
              router
            )
          }
        />
      )}
      <Box pb={10}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-evenly"
          width="100%"
          minHeight={195}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <Box display="flex" justifyContent="center" alignItems="center">
            <SelectInput<Cycle>
              label="Cycle"
              icon={<RotateRight />}
              value={cycle?.id || ''}
              items={group.cycles}
              itemKey="id"
              itemName="name"
              setValue={(value) => {
                const cycle = group.cycles.find((cycle) => cycle.id === value)!;
                setCycle(cycle);
              }}
            />
          </Box>

          {/* Component Chips (Sticky Behavior) */}
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            pb={!isSticky ? 1 : 0}
            sx={{
              borderBottomRightRadius: '20px',
              borderBottomLeftRadius: '20px',
              borderTopRightRadius: isSticky ? '20px' : 0,
              borderTopLeftRadius: isSticky ? '20px' : 0,
              backgroundColor: theme.palette.background.paper,
              position: isSticky ? 'fixed' : undefined,
              top: isSticky ? '70px' : undefined,
              zIndex: 1000,
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
            />
          </Box>
        </Box>

        {/* Choose cycle */}
        <Box mb={2} />

        {cycle && (
          <Box borderRadius={2} borderColor={theme.palette.primary.main}>
            {/* Training weeks */}
            <Stack spacing={1} mt={2}>
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
                          setFilteredTrainings,
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
                          setFilteredTrainings,
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
    </>
  );
}
