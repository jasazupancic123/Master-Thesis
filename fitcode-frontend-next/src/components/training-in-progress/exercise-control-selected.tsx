import { Box, Divider, Typography } from '@mui/material';

import RomChart from '../charts/rom/rom-chart';
import RomStatistic from '../charts/rom/rom-statistics';
import TempoChart from '../charts/tempo/tempo-chart';
import TempoStatistic from '../charts/tempo/tempo-statistic';
import { TrainingInProgressExerciseControl } from './enum/exercise-controls.enum';
import SWControl from './sw-control';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import ImageGallery from '@/ui/image-gallery';
import { CONTROLS_TEXT_PLACEHOLDERS } from './constant/exercise-controls-text-placeholders';
import { theme } from '@/app/style';

interface Props {
  selectedControl: TrainingInProgressExerciseControl;
}

export default function ExercieseControlSelected(props: Props) {
  const { selectedControl } = props;

  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { selectedExercise, setIndex } = trainingInProgressContext;

  const { trainingInProgress } = trainingContext;

  if (setIndex === undefined || !selectedExercise || !trainingInProgress)
    return null;

  const isSetCompleted = selectedExercise.recordedSets?.some(
    (set) => set.setIndex === setIndex
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
          {isSetCompleted ? (
            <>
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
          {isSetCompleted ? (
            <>
              <RomChart
                selectedExercise={selectedExercise}
                setIndex={setIndex}
                width={Math.min(window.innerWidth * 0.95, 620)} // max 620px
              />
              <RomStatistic
                selectedExercise={selectedExercise}
                setIndex={setIndex}
              />
            </>
          ) : (
            <ControlsTextPlaceholder selectedControl={selectedControl} />
          )}
        </Box>
      );
    }
    case TrainingInProgressExerciseControl.GALLERY: {
      return isSetCompleted ? (
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
        sx={{ mx: 'auto' }}
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
