import { Check } from '@mui/icons-material';
import { Box, Collapse, IconButton } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import AthleteSuperset from '../athlete-superset/athlete-superset';
import MyModal from '../modal/modal';
import { CommonService } from '@/common/service/common.service';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useAuth } from '@/store/auth-provider';
import { useTraining } from '@/store/training-provider';

const commonService = CommonService.instance;

interface AthleteTrainingComponentsProps {
  training: Training;
  components: TrainingComponent[];
  selectedComponent: TrainingComponent | null;
  setSelectedComponent: SetState<TrainingComponent | null>;
  showSupersets: boolean;
  setShowSupersets: SetState<boolean>;
  modal: boolean;
  setModal: SetState<boolean>;
  timeout: number;
}

export default function AthleteTrainingComponents(
  props: AthleteTrainingComponentsProps
) {
  const {
    training,
    components,
    selectedComponent,
    setSelectedComponent,
    showSupersets,
    setShowSupersets,
    modal,
    setModal,
    timeout,
  } = props;

  const { setTrainingInProgress, setView } = useTraining();
  const { user } = useAuth();

  const theme = useTheme();
  const router = useRouter();

  if (!user) {
    return (
      <Typography textAlign="center" sx={{ fontSize: 12 }}>
        Please log in to view training components.
      </Typography>
    );
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap={1}
    >
      <Box
        width="100%"
        sx={{
          overflowX: 'auto',
        }}
      >
        <Box
          display="inline-flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
          sx={{
            minWidth: '100%',
          }}
        >
          {components.map((component) => {
            const IconComponent = commonService.navigation.getComponentIcon(
              component.id
            );

            return (
              <Box key={component.id} minWidth="48px">
                <IconButton
                  sx={[
                    user && component.completedMembersIds.includes(user.uid)
                      ? {
                          opacity:
                            selectedComponent?.id !== component.id ? 0.5 : 1,
                          position: 'relative',
                          backgroundColor:
                            selectedComponent?.id === component.id
                              ? theme.palette.background.light
                              : theme.palette.background.dark,
                        }
                      : {},
                    {
                      m: 0,
                    },
                  ]}
                  onClick={() => {
                    setShowSupersets(true);
                    setSelectedComponent(component);
                  }}
                >
                  {IconComponent && (
                    <IconComponent
                      sx={{
                        fontSize: 26,
                        cursor: 'pointer',
                        color:
                          selectedComponent?.id === component.id
                            ? theme.palette.primary.main
                            : undefined,
                      }}
                    />
                  )}

                  {user && component.completedMembersIds.includes(user.uid) && (
                    <Check
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 0,
                        color: theme.palette.primary.main,
                        fontSize: 16,
                      }}
                    />
                  )}
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Collapse in={showSupersets} timeout={timeout}>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          gap={2}
          maxWidth={600}
          sx={{
            mx: 'auto',
          }}
        >
          {!selectedComponent?.supersets.length ? (
            <Typography textAlign="center" sx={{ fontSize: 12 }}>
              No supersets available
            </Typography>
          ) : (
            (() => {
              const supersets = TrainingService.getPrescribedSupersetsByUser(
                user.uid,
                selectedComponent
              );

              return supersets.map((superset, i) => (
                <AthleteSuperset
                  key={`superset-${i}`}
                  superset={superset}
                  supersetIndex={i}
                  supersets={supersets}
                />
              ));
            })()
          )}
        </Box>
      </Collapse>
      <MyModal
        isOpen={modal}
        setIsOpen={(open) => setModal(open)}
        cancelText="Cancel"
        onCancel={() => setModal(false)}
        onConfirm={() => {
          if (!user) {
            toast.error('Authentication error.');
            return;
          }

          if (!selectedComponent) {
            toast.error('No component selected.');
            return;
          }

          if (selectedComponent.completedMembersIds.includes(user.uid)) {
            toast.error('You have already completed this component.');
            return;
          }

          handleApiRequest(
            router,
            () =>
              TrainingController.getPrescribedTraining(training.id, user.uid),
            (training) => {
              setTrainingInProgress({
                training: training,
                selectedComponent: selectedComponent,
                userId: user.uid,
              } as TrainingInProgress);

              setView(ExerciseTrainingView.TrainingView);
              setModal(false);
            },
            undefined,
            'Failed to start training'
          );
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Start <b>{selectedComponent?.component?.name || 'training'}</b>?
        </Typography>
      </MyModal>
    </Box>
  );
}
