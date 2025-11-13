'use client';

import { Box, Divider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import RomChart from '../charts/rom/rom-chart';
import RomStatistic from '../charts/rom/rom-statistics';
import TempoChart from '../charts/tempo/tempo-chart';
import TempoStatistic from '../charts/tempo/tempo-statistic';
import { CONTROLS_TEXT_PLACEHOLDERS } from './constant/exercise-controls-text-placeholders';
import { TrainingInProgressExerciseControl } from './enum/exercise-controls.enum';
import SWControl from './sw-control';
import { theme } from '@/app/style';
import type { TrainingExerciseRecordedSet } from '@/core/training/type/training-exercise.type';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import ImageGallery from '@/ui/image-gallery';

interface Props {
  selectedControl: TrainingInProgressExerciseControl;
}

export default function ExercieseControlSelected(props: Props) {
  const { selectedControl } = props;

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { selectedExercise, setIndex, supersetIndex } =
    trainingInProgressContext;

  const { trainingInProgress } = trainingContext;

  const [completedSet, setCompletedSet] = useState<
    TrainingExerciseRecordedSet | undefined
  >(
    trainingInProgress?.recordedSets?.find(
      (set) =>
        set.setIndex === setIndex &&
        set.exerciseId === selectedExercise?.id &&
        set.supersetIndex === supersetIndex
    )
  );

  useEffect(() => {
    if (!trainingInProgress || !selectedExercise) return;

    const foundSet = trainingInProgress.recordedSets?.find(
      (set) =>
        set.setIndex === setIndex &&
        set.exerciseId === selectedExercise.id &&
        set.supersetIndex === supersetIndex
    );

    setCompletedSet(foundSet);
  }, [
    trainingInProgress?.recordedSets,
    setIndex,
    supersetIndex,
    selectedExercise,
  ]);

  if (
    setIndex === undefined ||
    supersetIndex === undefined ||
    !selectedExercise ||
    !trainingInProgress
  )
    return null;

  switch (selectedControl) {
    case TrainingInProgressExerciseControl.TEMPO: {
      return (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          {completedSet ? (
            <>
              <TempoChart
                selectedExercise={selectedExercise}
                completedSet={completedSet}
                width={
                  window !== undefined
                    ? Math.min(window.innerWidth * 0.95, 360) // max 360px
                    : 320
                }
                isUnilateral={selectedExercise.exercise?.isUnilateral || false}
              />
              <TempoStatistic recordedSet={completedSet} />
            </>
          ) : (
            <ControlsTextPlaceholder selectedControl={selectedControl} />
          )}
        </Box>
      );
    }
    case TrainingInProgressExerciseControl.ROM: {
      return (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={1}
        >
          {completedSet ? (
            <>
              <RomChart
                selectedExercise={selectedExercise}
                completedSet={completedSet}
                width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
              />
              <RomStatistic completedSet={completedSet} />
            </>
          ) : (
            <ControlsTextPlaceholder selectedControl={selectedControl} />
          )}
        </Box>
      );
    }
    case TrainingInProgressExerciseControl.GALLERY: {
      return completedSet ? (
        <ImageGallery
          imagesL={completedSet.imagesL || []}
          imagesR={completedSet.imagesR || []}
          enableImagePickerSlider
        />
      ) : (
        <ControlsTextPlaceholder selectedControl={selectedControl} />
      );
    }
    case TrainingInProgressExerciseControl.SW: {
      return (
        trainingInProgress.startOfTraining && (
          <SWControl startOfTraining={trainingInProgress.startOfTraining} />
        )
      );
    }

    default:
      return null;
  }
}

function ControlsTextPlaceholder({
  selectedControl,
}: {
  selectedControl: TrainingInProgressExerciseControl;
}) {
  const text = CONTROLS_TEXT_PLACEHOLDERS.find(
    (placeholder) => placeholder.control === selectedControl
  )?.text;

  if (!text) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Divider
        sx={{
          width: 24,
          alignSelf: 'center',
          borderColor: theme.palette.text.primary,
        }}
      />
      <Typography
        maxWidth={200}
        fontSize={14}
        textAlign="center"
        sx={{ mx: 'auto', color: theme.palette.background.lightBorder }}
      >
        {text}
      </Typography>
      <Divider
        sx={{
          width: 24,
          alignSelf: 'center',
          borderColor: theme.palette.text.primary,
        }}
      />
    </Box>
  );
}
