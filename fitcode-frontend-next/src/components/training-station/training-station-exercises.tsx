import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useCoachTrainingStation } from '@/store/training-station.provider';

interface Props {
  exercise: TrainingExercise;
}

export default function TrainingStationExerciseCard(props: Props) {
  const {
    station,
    individualTrainings,
    component,
    selectedUser,
    selectedExercise,
    workloads,
    setSelectedExercise,
    setSelectedSetIndex,
  } = useCoachTrainingStation();

  const { exercise } = props;

  const individualTraining = individualTrainings.find(
    (t) => t.userId === selectedUser?.uid
  );

  const [progress, setProgress] = useState(0);

  // Update progress when selected exercise or individual training changes
  useEffect(() => {
    if (!component || !selectedExercise || !individualTraining) {
      setProgress(0);
      return;
    }

    const completedUserExerciseWorkloads = workloads.filter((wl) => {
      return (
        wl.exerciseId === exercise.id &&
        wl.userId === selectedUser?.uid &&
        wl.id !== undefined // if it has an id, it means it's saved (completed)
      );
    });

    const totalSets = individualTraining
      ? individualTraining.components
          .find((c) => c.id === component.id)
          ?.supersets.flatMap((s) => s.exercises)
          .find((e) => e.id === exercise.id)?.sets.length || 0
      : 0;

    setProgress(
      totalSets === 0
        ? 0
        : (completedUserExerciseWorkloads.length / totalSets) * 100
    );
  }, [selectedExercise, individualTraining, workloads, exercise, component]);

  if (!station) return null;

  if (!individualTraining) return null;

  const IMAGES_WIDTH = 100;
  const IMAGES_HEIGHT = IMAGES_WIDTH * 0.6;

  return (
    <Box
      key={exercise.id}
      width={IMAGES_WIDTH}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={0.5}
      onClick={() => {
        if (!selectedUser) return;

        setSelectedExercise(exercise);

        const individualTraining = individualTrainings.find(
          (it) => it.userId === selectedUser.uid
        );

        if (!individualTraining) return;

        const individualExercise = individualTraining.components
          .flatMap((c) => c.supersets.flatMap((s) => s.exercises))
          .find((ie) => ie.id === exercise.id);

        if (!individualExercise) return;

        const userExerciseWorkloads = workloads.filter(
          (w) => w.userId === selectedUser.uid && w.exerciseId === exercise.id
        );

        const completedSets =
          userExerciseWorkloads.length >= individualExercise.sets.length
            ? 0
            : userExerciseWorkloads.length;

        setSelectedSetIndex(completedSets);
      }}
      sx={{
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={IMAGES_WIDTH}
        height={IMAGES_HEIGHT}
        sx={{
          borderRadius: 2,
          border:
            selectedExercise?.id === exercise.id
              ? `2px solid ${theme.palette.primary.main}`
              : '2px solid transparent',
          overflow: 'hidden',
          flex: '0 0 auto',
          position: 'relative',
          opacity: progress === 100 ? 0.5 : 1,
        }}
      >
        <Image
          src={exercise.exercise?.imageUrl || EXERCISE_DEFAULT_IMG_URL}
          alt="Exercise Image"
          width={IMAGES_WIDTH}
          height={IMAGES_HEIGHT}
          unoptimized={lib.common.env.unoptimizeImages()}
          style={{
            filter: 'grayscale(100%)',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </Box>

      <Typography
        fontSize={12}
        fontWeight={500}
        textAlign="center"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {exercise.exercise?.name || 'Unknown Exercise'}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          display: progress > 0 ? undefined : 'none',
          position: 'absolute',
          bottom: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          height: 4,
          borderRadius: 5,
          border: `1px solid ${theme.palette.primary.main}`,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          [`&.${linearProgressClasses.bar}`]: {
            bgcolor: theme.palette.primary.main,
          },
          [`&.${linearProgressClasses.colorPrimary}`]: {
            bgcolor: theme.palette.background.default,
          },
          zIndex: 10,
        }}
      />
    </Box>
  );
}
