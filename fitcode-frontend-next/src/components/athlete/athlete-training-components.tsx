import { Check, Circle, Pause } from '@mui/icons-material';
import { Box, Collapse, IconButton, SvgIcon } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';

import AthleteSuperset from './athlete-superset';
import StartTrainingComponentModal from './modals/start-training-component-modal';
import { core } from '@/core/core.service';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';

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

  const { activeTraining } = useMain();
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

            let componentStatus = activeTraining?.statuses?.find(
              (s) =>
                s.componentId === component.id && s.trainingId === training.id
            )?.status;

            if (!componentStatus) {
              const isTrainingWithStatuses =
                lib.common.typeChecker.isTrainingWithStatuses(training);

              if (isTrainingWithStatuses) {
                componentStatus = training.statuses?.find(
                  (s) =>
                    s.componentId === component.id &&
                    s.trainingId === training.id
                )?.status;
              }
            }

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

      <StartTrainingComponentModal
        training={training}
        selectedComponent={selectedComponent}
        open={modal}
        setOpen={setModal}
      />
    </Box>
  );
}
