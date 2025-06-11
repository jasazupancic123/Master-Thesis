import { CommonService } from '@/common/service/common.service';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { SetState } from '@/common/type/state.type';

interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
  training: Training;
  setOpenAddExerciseModal: SetState<boolean>;
}

const commonService = CommonService.instance;

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const { trainingComponent, training, setOpenAddExerciseModal } = props;

  const theme = useTheme();
  const screenSize = useScreenSize();

  const { setTraining, component, setComponent } = useTrainerDayViewContext();

  return (
    <Box display="flex" p={0} py={1}>
      {trainingComponent.component &&
        (() => {
          const IconComponent = commonService.navigation.getComponentIcon(
            trainingComponent.component.name
          );

          return (
            <Box display="flex" alignItems="center">
              <Box
                display="flex"
                alignItems="center"
                sx={{ cursor: 'pointer', p: 0, m: 0 }}
                onClick={() => {
                  if (trainingComponent && !component) {
                    setTraining(training);
                    setComponent(trainingComponent);
                  }
                }}
              >
                {component &&
                trainingComponent &&
                trainingComponent.id === component.id ? (
                  <Tooltip
                    title="Add exercise"
                    sx={{
                      cursor: 'pointer',
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        if (
                          component &&
                          trainingComponent &&
                          trainingComponent.id === component.id
                        )
                          setOpenAddExerciseModal(true);
                      }}
                      sx={{ p: 0, m: 0 }}
                    >
                      <IconComponent fontSize="medium" color="primary" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <IconComponent fontSize="medium" color="primary" />
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.primary.main,
                    pl: 1,
                    mb: 0,
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                  }}
                  onClick={() => {
                    if (
                      trainingComponent &&
                      component &&
                      trainingComponent.id === component.id
                    ) {
                      setTraining(undefined);
                      setComponent(undefined);
                    } else {
                      setTraining(training);
                      setComponent(trainingComponent);
                    }
                  }}
                >
                  {trainingComponent.component.name}
                </Typography>{' '}
              </Box>

              {screenSize.isMobile ? (
                <Typography variant="caption" ml={2}>
                  {commonService.date.formatTime(trainingComponent.from)}
                </Typography>
              ) : (
                <Typography variant="caption" ml={2}>
                  {commonService.date.formatTime(trainingComponent.from)}
                </Typography>
              )}
            </Box>
          );
        })()}
    </Box>
  );
}
