import { Check, Circle, Pause } from '@mui/icons-material';
import { Box, Collapse, IconButton, SvgIcon } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import AthleteSuperset from './athlete-superset';
import { core } from '@/core/core.service';
import { Components } from '@/core/exercise/constant/components.constant';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { ExerciseSetTracking } from '@/core/training/type/exercise-set-tracking-state.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import {
  TRAINING_IN_PROGRESS_STORAGE_KEY,
  useTraining,
} from '@/store/training.provider';
import MyModal from '@/ui/modal';
import { useEffect } from 'react';
import { TrainingReport } from '@/core/training/type/training-report.type';
import { TrainingReportService } from '@/core/training/training.report.service';
import dayjs from 'dayjs';

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

  const { reports, setTrainingInProgress } = useTraining();
  const { exercises, activeTraining, setActiveTraining } = useMain();
  const { user } = useAuthenticatedAuth();

  const activeTrainingReport = activeTraining?.report;
  const activeComponentStatus = activeTrainingReport?.componentStatuses.find(
    (cs) => cs.componentId === selectedComponent?.id
  )?.status;

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

                  {componentStatus === TrainingStatus.PAUSED && (
                    <Pause
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 0,
                        color: theme.palette.error.main,
                        fontSize: 12,
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
        onConfirm={async () => {
          if (!selectedComponent) {
            toast.error('No component selected.');
            return;
          }

          let trainingToStart: Training | null = null;
          const controller = TrainingController.getInstance();

          try {
            const foundReport = reports.find(
              (r) => r.trainingId === training.id
            );

            const foundReportComponentStatus =
              foundReport?.componentStatuses.find(
                (cs) => cs.componentId === selectedComponent.id
              );

            if (
              foundReportComponentStatus &&
              foundReportComponentStatus.status === TrainingStatus.COMPLETED
            ) {
              toast.error(
                'This training component has already been completed.'
              );

              setModal(false);
              return;
            }

            if (activeTraining && activeTraining.report) {
              const foundComponentStatus =
                activeTraining.report.componentStatuses.find(
                  (cs) => cs.componentId === selectedComponent.id
                );

              if (
                foundComponentStatus &&
                foundComponentStatus.status === TrainingStatus.COMPLETED
              ) {
                toast.error(
                  'This training component has already been completed.'
                );

                setModal(false);
                return;
              }
            }

            if (!activeTraining) {
              // start new training
              const result = await controller.startTrainingComponent(
                training.id,
                selectedComponent.id
              );

              trainingToStart = result.trainings[user.uid];

              const errors = result.errors as unknown as {
                field: string;
                message: string;
              }[];

              if (errors && errors.length > 0) {
                toast.error(`Error: ${errors[0].message}`);
                setModal(false);

                return;
              }
            } else if (
              activeTraining.report &&
              training.id !== activeTraining.report.trainingId
            ) {
              toast.error(
                'Another training is already in progress. Please finish it before starting a new one.'
              );

              setModal(false);

              return;
            } else {
              // restart training with new component
              const result = await controller.startTrainingComponent(
                training.id,
                selectedComponent.id
              );

              trainingToStart = result.trainings[user.uid];

              const errors = result.errors as unknown as {
                field: string;
                message: string;
              }[];

              if (errors && errors.length > 0) {
                toast.error(`Error: ${errors[0].message}`);
                setModal(false);

                return;
              }
            }
          } catch (e) {
            console.error(e);
            toast.error((e as Error).message || 'An error occurred.');
            return;
          }

          if (!trainingToStart) {
            toast.error('Failed to start training. Please try again.');
            return;
          }

          trainingToStart = TrainingService.mapData(trainingToStart, {
            exercises,
          });

          const component = trainingToStart.components.find(
            (c) => c.id === selectedComponent.id
          );

          if (!component) {
            toast.error(
              'Selected component not found in training. Please try again.'
            );

            return;
          }

          const report = TrainingReportService.initEmptyTrainingReport(
            trainingToStart,
            component,
            user
          );

          setActiveTraining((prev) => ({
            training: {
              ...trainingToStart,
              workloads: prev && prev.training ? prev.training.workloads : [],
            },
            report: report,
          }));

          const foundTrainingInProgressObject =
            await lib.common.indexedDb.items.get(
              `${TRAINING_IN_PROGRESS_STORAGE_KEY}_${trainingToStart.id}_${component.id}`
            );

          const foundTrainingInProgress = foundTrainingInProgressObject
            ? JSON.parse(foundTrainingInProgressObject.payload)
            : null;

          setTrainingInProgress({
            training: trainingToStart,
            selectedComponent: component,
            supersets: component.supersets,
            userId: user.uid,
            recordedSets: foundTrainingInProgress
              ? foundTrainingInProgress.recordedSets
              : [],
            startOfTraining:
              foundTrainingInProgress?.startOfTraining || dayjs(),
          } as TrainingInProgress);

          setModal(false);

          lib.common.audio.playSound('/sounds/training-in-progress-start.mp3');

          router.push(
            `/trainings/${training.id}/components/${selectedComponent.id}`
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
