import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import type { RefCallback } from 'react';
import { useState } from 'react';

import useRecoveryTime from './hooks/use-recovery-time';
import { theme } from '@/app/style';
import { core } from '@/core/core.service';
import { ExerciseParamFieldEnum } from '@/core/exercise/enum/exercise-param-field.enum';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import type { Superset } from '@/core/training/type/superset.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';

interface Props {
  exercise: TrainingExercise;
  superset: Superset;
  supersetIndex: number;
  getExerciseRef: (exerciseId: string) => RefCallback<HTMLElement | null>;
}

export const INVALID_RECOVERY_TIME = -1;

export default function TrainingInProgressExerciseHeaderCard(props: Props) {
  const { activeTraining } = useMain();

  const { trainingInProgress } = useTrainings();

  const {
    setSupersetIndex,
    selectedExercise,
    setSelectedExercise,
    setSetIndex,
  } = useTrainingInProgress();

  const { exercise, superset, supersetIndex, getExerciseRef } = props;

  const isSelected = selectedExercise?.id === exercise.id;

  const exerciseObject = exercise.exercise;

  const workloads = !trainingInProgress
    ? []
    : (activeTraining?.workloads || []).filter((wl) => {
        return (
          wl.trainingId === trainingInProgress.training.id &&
          wl.componentId === trainingInProgress.selectedComponent.id &&
          wl.exerciseId === exercise.id &&
          wl.supersetIndex === supersetIndex
        );
      });

  const lastCompletedWorkload = !trainingInProgress
    ? undefined
    : ExerciseSetService.findLastCompletedWorkload(
        {
          trainingId: trainingInProgress.training.id,
          componentId: trainingInProgress.selectedComponent.id,
          exerciseId: exercise.id,
          supersetIndex: supersetIndex,
        },
        workloads
      );

  const recType = core.training.set.getRecType(exercise.sets[0]);

  const initValue: number = recType
    ? exercise.sets[
        lastCompletedWorkload ? lastCompletedWorkload.setNumber - 1 : 0
      ][recType] || 0
    : INVALID_RECOVERY_TIME;

  const [value, setValue] = useState<number | string>(initValue);

  useRecoveryTime(
    ExerciseParamFieldEnum.REC_TIME,
    initValue,
    setValue,
    exercise
  );

  if (
    !exerciseObject ||
    supersetIndex === undefined ||
    !activeTraining ||
    !trainingInProgress
  )
    return null;

  const width = 90;
  const height = width * (2 / 3);

  const completedSets = ExerciseSetService.getCompletedExerciseSetsCount(
    {
      trainingId: trainingInProgress.training.id,
      componentId: trainingInProgress.selectedComponent.id,
      exerciseId: exercise.id,
      supersetIndex: supersetIndex,
    },
    activeTraining.workloads
  );

  const progress = (completedSets / exercise.sets.length) * 100;

  const showRecoveryTime =
    initValue !== INVALID_RECOVERY_TIME &&
    progress !== 100 &&
    progress > 0 &&
    typeof value === 'number';

  return (
    <Box
      component="div"
      key={exercise.id}
      ref={getExerciseRef(exercise.id)}
      display="flex"
      flexDirection="column"
      alignItems="center"
      onClick={() => {
        const newSupersetIndex = trainingInProgress.supersets.indexOf(superset);

        if (newSupersetIndex === -1) return;

        setSupersetIndex(supersetIndex);

        setSetIndex(0);

        setSelectedExercise(exercise);
      }}
      sx={{
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : '1px solid transparent',
        borderRadius: 2,
        overflow: 'hidden',
        width,
        height,
        flex: '0 0 auto',
        position: 'relative',
        scrollBehavior: 'smooth',
      }}
    >
      <Box
        sx={{
          filter: 'grayscale(100%)',
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      >
        {exerciseObject.imageUrl || !exerciseObject.videoUrl ? (
          <Image
            src={exerciseObject.imageUrl || EXERCISE_DEFAULT_IMG_URL}
            alt={exerciseObject.name}
            width={width}
            height={height}
            unoptimized={lib.common.env.unoptimizeImages()}
            style={{
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Box
            component="video"
            sx={{
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            controls={false}
            src={exerciseObject.videoUrl!}
            muted
            loop
            playsInline
          />
        )}
      </Box>

      {showRecoveryTime && (
        <Typography
          fontSize={12}
          textAlign="center"
          sx={{
            zIndex: 10,
            backgroundColor: theme.palette.background.default,
            px: 0.5,
            borderRadius: 1,
            color: value < 0 ? theme.palette.primary.main : undefined,
          }}
        >
          {value}s
        </Typography>
      )}

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          display: progress > 0 ? undefined : 'none',
          position: 'absolute',
          bottom: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          height: 5,
          borderRadius: 5,
          border: `1px solid ${theme.palette.primary.main}`,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          [`&.${linearProgressClasses.bar}`]: {
            bgcolor: theme.palette.primary.main,
          },
          [`&.${linearProgressClasses.colorPrimary}`]: {
            bgcolor: theme.palette.background.default,
          },
        }}
      />
    </Box>
  );
}
