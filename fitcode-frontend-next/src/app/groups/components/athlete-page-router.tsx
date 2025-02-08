'use client';

import { GroupPageProps } from '@/group/type/props.type';
import Box from '@mui/material/Box';
import SelectInput from '@/components/select-input';
import { Group } from '@/group/entity/group.entity';
import GroupIcon from '@mui/icons-material/Group';
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/app-provider';
import { GroupController } from '@/group/group.controller';
import { TrainingController } from '@/training/training.controller';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AthleteTrainingExerciseCard from '@/training/components/athlete-training-exercise-card';
import { CommonService } from '@/common/service/common.service';
import { Divider } from '@mui/material';
import { Training } from '@/training/type/training.entity';
import { TrainingService } from '@/training/training.service';
import { Exercise } from '@/exercise/entity/exercise.entity';
import { ExerciseController } from '@/exercise/exercise.controller';
import { useFetch } from '@/hook/use-fetch';

export default function AthletePageRouter(props: GroupPageProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const { token, components } = useAppContext();
  const exercises = useFetch<Exercise[]>(ExerciseController.URL.exercises(), {
    auth: true,
  });

  useEffect(() => {
    async function fetchTrainings() {
      if (!exercises.data) return;

      try {
        let trainings = await TrainingController.findTrainings(token, {
          from: dayjs().startOf('day').toDate(),
          to: dayjs().endOf('day').toDate(),
        });

        trainings = trainings.map((training) =>
          TrainingService.map(training, {
            components: components.flat,
            exercises: exercises.data!,
          })
        );

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
                {training.components.map((component) => (
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
