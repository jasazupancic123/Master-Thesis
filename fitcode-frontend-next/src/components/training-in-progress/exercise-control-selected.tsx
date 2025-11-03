import { Box } from '@mui/material';

import RomChart from '../charts/rom/rom-chart';
import RomStatistic from '../charts/rom/rom-statistics';
import TempoChart from '../charts/tempo/tempo-chart';
import TempoStatistic from '../charts/tempo/tempo-statistic';
import { TrainingInProgressExerciseControl } from './enum/exercise-controls.enum';
import SWControl from './sw-contro';
import TempoTimes from './tempo-times';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import ImageGallery from '@/ui/image-gallery';

export default function ExercieseControlSelected(
  selectedControl: TrainingInProgressExerciseControl
) {
  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { selectedExercise, setIndex } = trainingInProgressContext;

  const { trainingInProgress } = trainingContext;

  if (setIndex === undefined || !selectedExercise || !trainingInProgress)
    return null;

  const isSetCompleted = trainingInProgress.exerciseSetTrackingState?.find(
    (s) =>
      s.exerciseId === selectedExercise.id &&
      s.completedSetNumbers.includes(setIndex + 1)
  );

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
          {/* {isSetCompleted &&
            (selectedExercise.sets[setIndex].tempo !== undefined ||
              selectedExercise.sets[setIndex].tempoR !== undefined) && (
              <TempoTimes
                tempo={selectedExercise.sets[setIndex].tempo}
                tempoR={selectedExercise.sets[setIndex].tempoR}
              />
            )} */}

          <TempoChart
            selectedExercise={selectedExercise}
            setIndex={setIndex}
            width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
            isUnilateral={selectedExercise.exercise?.isUnilateral || false}
          />
          <TempoStatistic
            selectedExercise={selectedExercise}
            setIndex={setIndex}
          />
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
          <RomChart
            selectedExercise={selectedExercise}
            setIndex={setIndex}
            width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
          />
          <RomStatistic
            selectedExercise={selectedExercise}
            setIndex={setIndex}
          />
        </Box>
      );
    }
    case TrainingInProgressExerciseControl.GALLERY: {
      return (
        <ImageGallery
          imagesL={
            (selectedExercise.recordedSets || []).find(
              (set) => set.setIndex === setIndex
            )?.imagesL || []
          }
          imagesR={
            (selectedExercise.recordedSets || []).find(
              (set) => set.setIndex === setIndex
            )?.imagesR || []
          }
          enableImagePickerSlider
        />
      );
    }
    case TrainingInProgressExerciseControl.SW: {
      return (
        trainingInProgress.startOfTraining && (
          <SWControl
            startOfTraining={trainingInProgress.startOfTraining}
            lastSetCompletedAt={trainingInProgress.lastSetCompletedAt}
            lastSetRecTimeS={trainingInProgress.lastSetRecTimeS}
          />
        )
      );
    }

    default:
      return null;
  }
}
