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
import { TrainingInfo } from '@/controller/training/type/training-info.type';

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
  const [selectedTraining, setSelectedTraining] = useState<TrainingInfo | null>(
    null
  );

  return (
    <Box>
      <Box>
        {/* Render days of the week */}
        <Stack
          width="90%"
          direction="row"
          p={2}
          sx={{
            marginX: 'auto',
            padding: '0px',
            textAlign: 'center',
            borderColor: 'background.default',
            backgroundColor: 'background.paper',
            height: '100%',
            cursor: components.length ? 'pointer' : 'default',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          <Box display="flex" flexDirection="column" width="100%">
            <Box display="flex" flexDirection="row" justifyContent="center">
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
            </Box>
          </Box>
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
