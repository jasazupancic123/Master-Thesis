import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { TrainingCycleViewWeekProps } from '../training-cycle-view-week/type';
import MyModal from '../modal/modal';
import { Training } from '@/controller/training/type/training.type';
import { useTheme } from '@mui/material';
import TrainingWeekDates from '../training-week-date/training-week-date';
import { TrainingMinimal } from '@/controller/training/type/training-minimal.type';

export default function TrainingWeek(props: TrainingCycleViewWeekProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const { components } = useGroup();

  const {
    index,
    week,
    selected,
    componentCalendarView,
    periodizationView,
    cycleView,
    trainingComponent,
    training,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    selectedTrainings,
    setSelectedTrainings,
    selectedTargets,
    selectedTarget,
    copyComponent,
    day,
    addTrainingComponent,
    deleteTrainingComponent,
    setTodaysTrainings,
  } = props;

  const [openAreYouSureModal, setOpenAreYouSureModal] = useState(false);
  const [selectedTraining, setSelectedTraining] =
    useState<TrainingMinimal | null>(null);

  return (
    <Box>
      <Box>
        {/* Render days of the week */}
        <Stack
          direction="row"
          p={2}
          sx={{
            padding: '0px',
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'background.default',
            backgroundColor: 'background.paper',
            height: '100%',
            cursor: components.length ? 'pointer' : 'default',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          {/* Extra column to display the week number */}
          <Typography
            color={theme.palette.background.paper}
            bgcolor={theme.palette.primary.main}
            p={screenSize.isMobile ? 0.1 : 2}
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              borderBottomRightRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            Week {index + 1}
          </Typography>

          <TrainingWeekDates
            week={week}
            componentCalendarView={componentCalendarView}
            periodizationView={periodizationView}
            cycleView={cycleView}
            copyComponent={copyComponent}
            trainingComponent={trainingComponent}
            training={training}
            selectedTrainings={selectedTrainings}
            setSelectedTrainings={setSelectedTrainings}
            selected={selected}
            selectedTarget={selectedTarget}
            selectedTargets={selectedTargets}
            setTodaysTrainings={setTodaysTrainings}
            setOpenAreYouSureModal={setOpenAreYouSureModal}
            setSelectedTraining={setSelectedTraining}
            setOpenOverwriteModal={setOpenOverwriteModal}
            setTrainingInPeriodForModal={setTrainingInPeriodForModal}
            addTrainingComponent={addTrainingComponent}
            deleteTrainingComponent={deleteTrainingComponent}
            day={day}
          />
        </Stack>
      </Box>
      <MyModal
        isOpen={openAreYouSureModal && !componentCalendarView}
        setIsOpen={(open) => setOpenAreYouSureModal(open)}
        cancelText="Cancel"
        onCancel={() => {
          setOpenAreYouSureModal(false);
          setSelectedTraining(null);
        }}
        onConfirm={() => {
          if (!selectedTraining) return;
          addTrainingComponent(selectedTraining.id, {
            components: [],
          });
          setSelectedTraining(null);
          setOpenAreYouSureModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Delete {dayjs(selectedTraining?.from).format('A')} training on{' '}
          {dayjs(selectedTraining?.from).format('DD.MM')}
        </Typography>
      </MyModal>
    </Box>
  );
}
