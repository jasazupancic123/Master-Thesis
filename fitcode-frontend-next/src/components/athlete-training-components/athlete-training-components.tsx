import { Box, Collapse, IconButton, SvgIcon } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import AthleteSuperset from '../athlete-superset/athlete-superset';
import MyModal from '../modal/modal';
import { getComponentIcon } from '@/common/service/util/icons.util';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import type { ExerciseSetTracking } from '@/common/type/exercise-set-tracking-state.type';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';

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
  const { exercises } = useMain();
  const { token, user } = useAuthenticatedAuth();
  const controller = TrainingController.getInstance(token);

  const theme = useTheme();
  const router = useRouter();

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
            const IconComponent = getComponentIcon(component.id);

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
              const supersets = TrainingService.getSupersetsByAthlete(
                user.uid,
                selectedComponent
              );

              return supersets.map((superset, i) => (
                <AthleteSuperset
                  key={`superset-${i}`}
                  superset={superset}
                  supersetIndex={i}
                  supersets={supersets}
                  training={training}
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

          handleApiRequest(
            router,
            () => controller.getPrescribedTraining(training.id, user.uid),
            (training) => {
              if (!training) {
                toast.error('Failed to start training. Please try again.');
                return;
              }
              TrainingService.mapData(training, { exercises });

              const state: ExerciseSetTracking[] =
                selectedComponent.supersets
                  .map((s, sIndex) => {
                    return s.exercises.map((e) => {
                      return {
                        exerciseId: e.id,
                        supersetIndex: sIndex,
                        completedSetNumbers: [] as number[],
                      };
                    });
                  })
                  .flat() || [];

              setTrainingInProgress({
                training,
                selectedComponent: selectedComponent,
                userId: user.uid,
                exerciseSetTrackingState: state,
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
