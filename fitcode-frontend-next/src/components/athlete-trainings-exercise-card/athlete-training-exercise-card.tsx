import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import MyModal from '../modal/modal';
import { useTheme } from '@mui/material';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import AthleteTrainingComponents from '../athlete-training-components/athlete-training-components';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';

type AthleteTrainingExerciseCardProps = {
  components: TrainingComponent[];
  training: Training;
  profile: User;
  token: string;
};

export default function AthleteTrainingExerciseCard(
  props: AthleteTrainingExerciseCardProps
) {
  const theme = useTheme();
  const router = useRouter();
  const { components, training, profile, token } = props;
  const screenSize = useScreenSize();

  const { trainingInProgress, setTrainingInProgress, setView } = useTraining();

  const [supersets, setSupersets] = useState<Superset[]>();
  const [openAreYouSureModal, setOpenAreYouSureModal] = useState(false);
  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!trainingInProgress || !trainingInProgress.selectedComponent) return;
    let usersSupersets = undefined;
    for (const subgroup of trainingInProgress.selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) {
      usersSupersets = trainingInProgress.selectedComponent.supersets; //default group
    }
    setSupersets(usersSupersets);
  }, [trainingInProgress?.selectedComponent]);

  useEffect(() => {}, [supersets]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box width="100%" display="flex" justifyContent="center">
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          sx={{
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Box display="flex" flexDirection="column" width="100%" gap={0.25}>
            <AthleteTrainingComponents
              components={components}
              training={training}
              supersets={supersets || []}
              profile={profile}
              setOpenAreYouSureModal={setOpenAreYouSureModal}
              setOpenVideoPlayerModal={setOpenVideoPlayerModal}
              setVideoUrl={setVideoUrl}
            />
          </Box>
        </Box>
      </Box>

      <MyModal
        isOpen={openAreYouSureModal}
        setIsOpen={(open) => setOpenAreYouSureModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenAreYouSureModal(false)}
        onConfirm={() => {
          if (!trainingInProgress) {
            toast.error('No training selected.');
            return;
          }

          handleApiRequest(
            router,
            () => {
              /* TrainingController.findByIdAndPopulateAthleteWorkloads(
                token,
                trainingInProgress.training.id,
                trainingInProgress.selectedComponent.id
              ) */

              return {} as Promise<Training>;
            },
            (training) => {
              const selectedComponent = [
                training.warmup,
                ...training.components,
                training.cooldown,
              ].find((c) => c.id === trainingInProgress?.selectedComponent?.id);

              if (!selectedComponent) {
                toast.error('Component not found.');
                return;
              }
              setTrainingInProgress(
                (prev) =>
                  ({
                    ...prev,
                    training: training,
                    selectedComponent: selectedComponent,
                  }) as AthleteTrainingInProgress
              );
              setView(ExerciseTrainingView.TrainingView);
              setOpenAreYouSureModal(false);
            },
            undefined,
            'Failed to import exercises'
          );
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          You've smashed the training button. Ready to kick things off?
        </Typography>
      </MyModal>
      <MyModal
        isOpen={openVideoPlayerModal}
        setIsOpen={(open) => setOpenVideoPlayerModal(open)}
        cancelText="Close"
        onCancel={() => {
          setVideoUrl('');
          setOpenVideoPlayerModal(false);
        }}
        sx={{ p: videoUrl.length > 0 ? 0 : undefined }}
        dialogueContentSx={{ p: videoUrl.length > 0 ? 0 : undefined }}
      >
        {videoUrl.length > 0 ? (
          <Box
            component="video"
            src={videoUrl}
            controls
            autoPlay
            muted
            loop
            sx={{
              width: '100%', // Make it responsive
              maxWidth: screenSize.isLandscapeMobile ? 400 : 600, // Limit max width
            }}
          />
        ) : (
          <Typography variant="body2">No video available</Typography>
        )}
      </MyModal>
    </Box>
  );
}
