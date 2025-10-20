import InfoIcon from '@mui/icons-material/Info';
import { Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import React, { Fragment, useEffect, useState } from 'react';

import type { SetState } from '@/lib/common/type/state.type';
import TrainingWeek from '@/components/training-week/training-week';
import type { Component } from '@/core/component/type/component.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import type { Day } from '@/lib/common/service/date.util';
import { useGroup } from '@/store/group.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface TrainingComponentCalendarProps {
  trainingComponent: TrainingComponent;
  setOpenOverwriteModal: SetState<boolean>;
  setTrainingInPeriodForModal: SetState<Training | null>;
  copyComponent: boolean;
  day: Day;
}

export default function TrainingComponentCalendar(
  props: TrainingComponentCalendarProps
) {
  const theme = useTheme();

  const { cycle, setDateFrom, setDateTo } = useGroup();

  const { training } = useTrainerDayView();

  const {
    trainingComponent,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    copyComponent,
    day,
  } = props;

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
            {lib.common.date.weeks(cycle.from, cycle.to).map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  componentCalendarView
                  trainingComponent={trainingComponent}
                  week={week.map(({ date }) => dayjs(date!))}
                  selected={selectedComponents}
                  setSelected={(component) =>
                    setSelectedComponents(component as Component[])
                  }
                  addTrainingComponent={() => {}}
                  deleteTrainingComponent={() => {
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
