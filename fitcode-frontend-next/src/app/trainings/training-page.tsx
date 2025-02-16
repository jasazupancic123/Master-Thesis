'use client';

import { CommonService } from '@/common/service/common.service';
import AthleteTrainingExerciseCard from '@/components/athlete-trainings/athlete-training-exercise-card';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useState } from 'react';
import { TrainingPageProps } from './type';

const commonService = CommonService.instance;

export default function TrainingPage(props: TrainingPageProps) {
  const { token, trainings: allTrainings } = props;

  const [trainings, setTrainings] = useState(() =>
    allTrainings.filter(({ from }) =>
      commonService.date.isBetween(from, startOfDay(from), endOfDay(from))
    )
  );

  return (
    <>
      {/* Trainings */}
      <Stack p={2} sx={{ borderRadius: 2 }} spacing={3}>
        <>
          {trainings?.map((training, i) => (
            <Box key={i} sx={{ borderRadius: 2, p: 3 }}>
              {/* Training Time Header */}
              <Stack direction="row" sx={{ borderRadius: 5 }}>
                <Box
                  sx={{
                    width: 25,
                    height: 25,
                    backgroundColor: 'background.default',
                    borderBottomLeftRadius: 5,
                    borderTopLeftRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 3,
                  }}
                />

                <Stack
                  direction="row"
                  spacing={3}
                  sx={{
                    backgroundColor: '#025c59',
                    px: 1,
                    borderTopRightRadius: 5,
                    borderBottomRightRadius: 5,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {CommonService.instance.date.formatTime(
                      dayjs(training.from)
                    )}{' '}
                    -{' '}
                    {CommonService.instance.date.formatTime(dayjs(training.to))}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {CommonService.instance.date.format(new Date())}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 0.5, mb: 2 }} />

              {/* Components */}
              <Stack spacing={3}>
                {Object.values(training.components).map((component) => (
                  <Box key={component.id} sx={{ borderRadius: 2 }}>
                    <AthleteTrainingExerciseCard
                      token={token}
                      component={component}
                      training={training}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </>
      </Stack>
    </>
  );
}
