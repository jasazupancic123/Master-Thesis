import { Check, Circle } from '@mui/icons-material';
import { Box, Collapse, IconButton, SvgIcon } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import AthleteSuperset from './athlete-superset';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import { ExerciseTrainingView } from '@/core/training/enum/exercise-training-view.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import MyModal from '@/ui/modal';

interface Props {
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

export default function AthleteTrainingComponents(props: Props) {
  const theme = useTheme();
  const router = useRouter();

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

  const { reports, setTrainingInProgress, setView } = useTraining();
  const { exercises } = useMain();
  const { user } = useAuthenticatedAuth();

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap={1}
    >
      <Box width="100%" sx={{ overflowX: 'auto' }}>
        <Box
          display="inline-flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
          sx={{ minWidth: '100%' }}
        >
          {components.map((component) => {
            const IconComponent = lib.common.component.getIcon(component.id);

            let componentStatus: TrainingStatus | undefined;
            const trainingReport = reports.find(
              (r) => r.trainingId === training.id
            );

            if (trainingReport)
              componentStatus = trainingReport.componentStatuses.find(
                (cs) => cs.componentId === component.id
              )?.status;

            return (
              <Box key={component.id} minWidth="48px">
                <IconButton
                  sx={[
                    user
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
                    { m: 0 },
                  ]}
                  onClick={() => {
                    setShowSupersets(true);
                    setSelectedComponent(component);
                  }}
                >
                  {IconComponent && (
                    <SvgIcon
                      component={IconComponent as React.ElementType} // handles SvgIconComponent or your SvgC
                      inheritViewBox
                      sx={{
                        fontSize: 26,
                        cursor: 'pointer',
                        color:
                          selectedComponent?.id === component.id
                            ? theme.palette.primary.main
                            : undefined,
                        // force shapes inside the svg to use currentColor
                        '& path, & rect, & circle, & polygon, & ellipse, & line, & polyline':
                          {
                            fill: 'currentColor',
                            stroke: 'currentColor',
                          },
                      }}
                    />
                  )}

                  {componentStatus === TrainingStatus.IN_PROGRESS && (
                    <Circle
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 0,
                        color: theme.palette.primary.main,
                        fontSize: 12,
                      }}
                    />
                  )}

                  {componentStatus === TrainingStatus.COMPLETED && (
                    <Check
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 0,
                        color: theme.palette.success.main,
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
          sx={{ mx: 'auto' }}
        >
          {!selectedComponent?.supersets.length ? (
            <Typography textAlign="center" sx={{ fontSize: 12 }}>
              No supersets available
            </Typography>
          ) : (
            <>
              {core.training
                .getAthleteSupersets(user.uid, selectedComponent)
                .map((superset, i) => (
                  <AthleteSuperset
                    key={`superset-${i}`}
                    superset={superset}
                    training={training}
                  />
                ))}
            </>
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

          handleApiRequest(
            router,
            () =>
              TrainingController.getInstance().startTrainingComponent(
                training.id,
                selectedComponent.id
              ),
            (response) => {
              const training = response[user.uid];
              if (!training) {
                toast.error('Failed to start training. Please try again.');
                return;
              }

              TrainingService.mapData(training, { exercises });

              const component = training.components.find(
                (c) => c.id === selectedComponent.id
              );

              if (!component) {
                toast.error(
                  'Selected component not found in training. Please try again.'
                );

                return;
              }

              const state: ExerciseSetTracking[] =
                component.supersets
                  .map((s, sIndex) => {
                    return s.exercises.map((e) => {
                      return {
                        exerciseId: e.id,
                        supersetIndex: sIndex,
                        completedSetNumbers: [] as {
                          setNumber: number;
                          timestamp: Date;
                        }[],
                      };
                    });
                  })
                  .flat() || [];

              setTrainingInProgress({
                training,
                selectedComponent: component,
                userId: user.uid,
                exerciseSetTrackingState: state,
              } as TrainingInProgress);

              const text = `Welcome to today's ${selectedComponent.id} training. Let's get started!`;

              lib.common.textToSpeech.speak(text);

              setView(ExerciseTrainingView.TrainingView);
              setModal(false);
            },
            undefined,
            'Failed to start training'
          );
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Start{' '}
          <b>
            {Components.find((c) => c.field === selectedComponent?.id)?.name ||
              'training'}
          </b>
          ?
        </Typography>
      </MyModal>
    </Box>
  );
}
