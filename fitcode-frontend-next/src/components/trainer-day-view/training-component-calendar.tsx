import { SetState } from '@/common/type/state.type';
import TrainingWeek from '@/components/training-cycle-view-week/training-week';
import { useGroup } from '@/context/group-provider';
import { Component } from '@/controller/component/type/component.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';

interface TrainingComponentCalendarProps {
  trainingComponent: TrainingComponent;
  training: Training;
  setOpenOverwriteModal: SetState<boolean>;
  setTrainingInPeriodForModal: SetState<Training | null>;
  handleCopyComponentApiRequest: (
    trainingInPeriod: Training,
    component: TrainingComponent,
    overwrite?: boolean
  ) => Promise<void>;
}

export default function TrainingComponentCalendar(
  props: TrainingComponentCalendarProps
) {
  const {
    trainingComponent,
    training,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    handleCopyComponentApiRequest,
  } = props;

  const { cycle, setDateFrom, setDateTo } = useGroup();

  const theme = useTheme();
  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);

  // filter trainings by cycle
  useEffect(() => {
    if (!cycle) return;
    setDateFrom(dayjs(cycle.from));
    setDateTo(dayjs(cycle.to));
  }, [cycle]);

  return (
    <Box>
      {trainingComponent.component && (
        <Box
          display="flex"
          width="100%"
          alignItems="center"
          flexDirection="column"
        >
          <Typography variant="h6">
            {trainingComponent.component?.name[0].toUpperCase() +
              trainingComponent.component?.name.slice(1)}{' '}
            Calendar
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <InfoIcon /> Colored cells already have a training in period
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            Copying the outlined component
          </Typography>
        </Box>
      )}

      <Box mb={2} />
      {cycle && (
        <Box borderRadius={2} borderColor={theme.palette.primary.main}>
          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {cycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  componentCalendarView
                  trainingComponent={trainingComponent}
                  week={week.map(({ date }) => dayjs(date!))}
                  selected={selectedComponents}
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  addTrainingComponent={(trainingId, input) => {}}
                  deleteTrainingComponent={(trainingId, componentId) => {
                    return Promise.resolve();
                  }}
                  training={training}
                  setOpenOverwriteModal={setOpenOverwriteModal}
                  setTrainingInPeriodForModal={setTrainingInPeriodForModal}
                  handleCopyComponentApiRequest={handleCopyComponentApiRequest}
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
