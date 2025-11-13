import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { TrainingInProgressExerciseControl } from './enum/exercise-controls.enum';
import ExercieseControlSelected from './exercise-control-selected';
import useExerciseControls from './hooks/use-exercise-controls';
import AiNoticeModal from './modals/ai-notice-modal';
import { theme } from '@/app/style';
import { ExerciseSetService } from '@/core/exercise/exercise-set.service';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { lib } from '@/lib';
import { INDEXED_DB_FIELDS } from '@/lib/common/const/indexed-db-fields.const';
import { EXERCISE_POSES } from '@/lib/pose-detection/const/exercise-poses';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';

export default function TrainingInProgressExerciseControls() {
  const { activeTraining } = useMain();
  const trainingContext = useTraining();
  const trainingInProgressContext = useTrainingInProgress();

  const { setSelectedTrackingMethod } = useAthleteHeader();

  const { trainingInProgress } = trainingContext;

  const {
    selectedExercise,
    setIndex,
    supersetIndex,
    audioEnabled,
    setAudioEnabled,
  } = trainingInProgressContext;

  const [openAiNoticeModal, setOpenAiNoticeModal] = useState(false);

  const iconsDimension = 20;

  const {
    boxWidth,
    getExerciseControlsIcon,
    selectedControl,
    setSelectedControl,
  } = useExerciseControls(iconsDimension);

  if (!trainingInProgress || !selectedExercise) return;

  const isAiReady =
    selectedExercise?.exercise?.id !== undefined &&
    EXERCISE_POSES.find((ep) =>
      ep.exerciseIds.includes(selectedExercise?.exercise?.id || 'UNKNOWN')
    );

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        position="fixed"
        bottom={0}
        zIndex={1000}
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          p: 2,
          pb: 1,
          pt: 0.5,
          backgroundColor: theme.palette.background.dark,
        }}
      >
        <ExerciseControlItem
          label="REC"
          width={boxWidth}
          icon={
            <Box
              width={iconsDimension}
              height={iconsDimension}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                backgroundColor: isAiReady
                  ? theme.palette.primary.main
                  : theme.palette.grey[700],
                borderRadius: '25%',
              }}
            >
              <Box
                width={iconsDimension / 3}
                height={iconsDimension / 3}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  borderRadius: '50%',
                }}
              />
            </Box>
          }
          onClick={async () => {
            if (
              !selectedExercise.exercise ||
              setIndex === undefined ||
              supersetIndex === undefined ||
              !activeTraining
            )
              return;

            const hasAgreedToTerms = await lib.common.indexedDb.items.get(
              INDEXED_DB_FIELDS.aiNotice
            );

            if (!hasAgreedToTerms) {
              setOpenAiNoticeModal(true);
              return;
            }

            const hasPoseLogic =
              selectedExercise.exercise !== undefined &&
              EXERCISE_POSES.some((ep) =>
                ep.exerciseIds.includes(selectedExercise.exercise!.id)
              );

            if (!hasPoseLogic) {
              toast.error(
                'Pose detection is not supported for this exercise yet'
              );
              return;
            }

            const isCurrentSetDone = ExerciseSetService.isSetCompleted(
              {
                exerciseId: selectedExercise.id,
                componentId: trainingInProgress.selectedComponent.id,
                supersetIndex: supersetIndex,
                setIndex: setIndex,
              },
              activeTraining.workloads
            );

            if (isCurrentSetDone) {
              toast.error('This set is already marked as done');
              return;
            }

            setSelectedTrackingMethod(TrackingMethod.CAMERA);
          }}
        />

        <ExerciseControlItem
          label="Tempo"
          width={boxWidth}
          icon={getExerciseControlsIcon(
            TrainingInProgressExerciseControl.TEMPO,
            selectedControl === TrainingInProgressExerciseControl.TEMPO
          )}
          onClick={() => {
            setSelectedControl(TrainingInProgressExerciseControl.TEMPO);
          }}
        />

        <ExerciseControlItem
          label="Rom"
          width={boxWidth}
          icon={getExerciseControlsIcon(
            TrainingInProgressExerciseControl.ROM,
            selectedControl === TrainingInProgressExerciseControl.ROM
          )}
          onClick={() => {
            setSelectedControl(TrainingInProgressExerciseControl.ROM);
          }}
        />

        <ExerciseControlItem
          label="Gallery"
          width={boxWidth}
          icon={getExerciseControlsIcon(
            TrainingInProgressExerciseControl.GALLERY,
            selectedControl === TrainingInProgressExerciseControl.GALLERY
          )}
          onClick={() => {
            setSelectedControl(TrainingInProgressExerciseControl.GALLERY);
          }}
        />

        <ExerciseControlItem
          label="SW"
          width={boxWidth}
          icon={getExerciseControlsIcon(
            TrainingInProgressExerciseControl.SW,
            selectedControl === TrainingInProgressExerciseControl.SW
          )}
          onClick={() => {
            setSelectedControl(TrainingInProgressExerciseControl.SW);
          }}
        />

        <ExerciseControlItem
          label="Audio"
          width={boxWidth}
          icon={getExerciseControlsIcon(
            TrainingInProgressExerciseControl.AUDIO,
            audioEnabled
          )}
          onClick={async () => {
            setAudioEnabled(!audioEnabled);
          }}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ py: 3 }}
      >
        <ExercieseControlSelected selectedControl={selectedControl} />
      </Box>

      <AiNoticeModal open={openAiNoticeModal} setOpen={setOpenAiNoticeModal} />
    </Box>
  );
}

function ExerciseControlItem(props: {
  width: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const { width, label, icon, onClick } = props;

  return (
    <Box
      width={width}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onClick={onClick}
      gap={0.25}
    >
      <Typography
        fontSize={10}
        sx={{
          color: theme.palette.text.primary,
        }}
      >
        {label}
      </Typography>
      {icon}
    </Box>
  );
}
