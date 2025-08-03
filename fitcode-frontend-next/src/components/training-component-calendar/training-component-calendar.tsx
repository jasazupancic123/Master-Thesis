import InfoIcon from '@mui/icons-material/Info';
import { Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';

import type { Day } from '@/common/service/util/date.util';
import type { SetState } from '@/common/type/state.type';
import TrainingWeek from '@/components/training-week/training-week';
import type { Component } from '@/controller/component/type/component.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingInfo } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useGroup } from '@/store/group-provider';

interface TrainingComponentCalendarProps {
  trainingComponent: TrainingComponent;
  training: Training;
  setOpenOverwriteModal: SetState<boolean>;
  setTrainingInPeriodForModal: SetState<TrainingInfo | null>;
  copyComponent: boolean;
  day: Day;
}

export default function TrainingComponentCalendar(
  props: TrainingComponentCalendarProps
) {
  const {
    trainingComponent,
    training,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    copyComponent,
    day,
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
                  copyComponent={copyComponent}
                  day={day}
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
