import React, { Fragment, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material';
import TrainingWeek from '@/components/training-cycle-view-week';
import { Component } from '@/controller/component/type/component.type';
import ExerciseChips from '@/components/exercise-chips';
import { ComponentService } from '@/controller/component/component.service';
import { FilterTypeViewProps } from '@/app/groups/[group_id]/type';
import SelectInput from '../select-input';
import { Cycle } from '@/controller/group/type/cycle.type';
import { RotateRight } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import {
  handleAddTrainingComponents,
  handleDeleteTraining,
  handleDeleteTrainingComponent,
} from './state';
import { useScreenSize } from '@/context/screen-size-provider';

export default function TrainerCycleView(props: FilterTypeViewProps) {
  const {
    token,
    group,
    components,
    trainings,
    setSelectedTrainings,
    selectedCycle,
    setSelectedCycle,
  } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [isSticky, setIsSticky] = useState(false);

  // Effect to track scroll position and set sticky mode
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 150); // Change 150px threshold if needed
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box pb={10}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        pt={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <SelectInput<Cycle>
          label="Cycle"
          icon={<RotateRight />}
          value={selectedCycle?.id || ''}
          items={group.cycles}
          itemKey="id"
          itemName="name"
          setValue={(value) => {
            const cycle = group.cycles.find((cycle) => cycle.id === value)!;
            setSelectedCycle(cycle);
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
            position: isSticky ? 'fixed' : undefined, // Sticky when scrolling
            top: isSticky ? '70px' : undefined, // Adjust top position
            zIndex: 1000, // Ensure it stays above other elements
            transition: 'top 1s ease-in-out', // Smooth transition effect
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

      {selectedCycle && (
        <Box borderRadius={2} borderColor="primary.main">
          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {selectedCycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  week={week.map(({ date }) => dayjs(date!))}
                  trainings={trainings}
                  components={selectedComponents}
                  selected={selectedComponents}
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  token={token}
                  group={group}
                  setSelectedTrainings={setSelectedTrainings}
                  selectedCycle={selectedCycle}
                  setSelectedComponents={setSelectedComponents}
                  addTrainingComponent={(trainingId, input) =>
                    handleAddTrainingComponents(
                      token,
                      trainingId,
                      input,
                      setSelectedTrainings,
                      components
                    )
                  }
                  deleteTraining={(trainingId) =>
                    handleDeleteTraining(
                      trainingId,
                      token,
                      setSelectedTrainings
                    )
                  }
                  deleteTrainingComponent={(trainingId, componentId) =>
                    handleDeleteTrainingComponent(
                      trainingId,
                      componentId,
                      token,
                      {},
                      setSelectedTrainings,
                      components
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
