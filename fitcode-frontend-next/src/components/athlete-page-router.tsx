'use client';

import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/app-provider';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { CommonService } from '@/common/service/common.service';
import { Divider } from '@mui/material';
import { useFetch } from '@/hook/use-fetch';
import { Training } from '@/controller/training/type/training.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import AthleteTrainingExerciseCard from '@/components/athlete-training-exercise-card';

export default function AthletePageRouter(props: any) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const { token, components } = useAppContext();
  const exercises = useFetch<Exercise[]>('/exercise', { auth: true });

  useEffect(() => {
    async function fetchTrainings() {
      if (!exercises.data) return;

      try {
        let trainings = await TrainingController.findAll(token, {
          from: dayjs().startOf('day').toDate(),
          to: dayjs().endOf('day').toDate(),
        });

        trainings.map((t) => {
          TrainingService.mapComponents(t, components.flat);
          TrainingService.mapExercises(t, exercises.data!);
        });

        setTrainings(trainings);
      } catch (e) {
        console.error(e);
        toast.error('Error fetching trainings');
      }
    }

    fetchTrainings().then();
  }, [token, exercises.data]);

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
                      component={component}
                      trainingId={training.id}
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
