import ExerciseChips from '@/components/exercise-chips';
import SelectInput from '@/components/select-input';
import {
  handleAddTrainingComponents,
  handleDeleteTraining,
  handleDeleteTrainingComponent,
} from '@/components/trainer-cycle-view/state';
import TrainingWeek from '@/components/training-cycle-view-week/training-week';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { RotateRight } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { Fragment, useEffect, useState } from 'react';

export default function TrainerCycleView() {
  const {
    token,
    group,
    components,
    cycle,
    setCycle,
    setTrainings,
    setDateFrom,
    setDateTo,
  } = useGroup();

  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
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
    <Box pb={10}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <SelectInput<Cycle>
          label=""
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

        {/* Exercise Chips (Sticky Behavior) */}
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
            components={ComponentService.toTree(components)}
            selected={selectedComponents}
            setSelected={(component) =>
              setSelectedComponents(component as Component[])
            }
            bgColor={theme.palette.background.default}
            primaryColor={theme.palette.primary.main}
          />
        </Box>
      </Box>

      {/* Choose cycle */}
      <Box mb={2} />

      {cycle && (
        <Box borderRadius={2} borderColor="primary.main">
          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {cycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  week={week.map(({ date }) => dayjs(date!))}
                  selected={selectedComponents}
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  addTrainingComponent={(trainingId, input) =>
                    handleAddTrainingComponents(
                      token,
                      { trainingId, ...input },
                      {
                        router,
                        components,
                        setTrainings,
                      }
                    )
                  }
                  deleteTraining={(trainingId) =>
                    handleDeleteTraining(
                      token,
                      { trainingId },
                      {
                        router,
                        setTrainings,
                      }
                    )
                  }
                  deleteTrainingComponent={(trainingId, componentId) =>
                    handleDeleteTrainingComponent(
                      token,
                      { trainingId, componentId },
                      { router, components, setTrainings }
                    )
                  }
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
