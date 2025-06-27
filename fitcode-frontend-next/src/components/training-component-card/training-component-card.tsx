import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { SetState } from '@/common/type/state.type';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { preconnect } from 'react-dom';

interface TrainingComponentProps {
  trainingComponent: TrainingComponent;
  training: Training;
  setOpenAddExerciseModal: SetState<boolean>;
  setOpenCalendarModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const {
    trainingComponent,
    training,
    setOpenAddExerciseModal,
    expandedExercisesView,
    setExpandedExercisesView,
  } = props;

  const screenSize = useScreenSize();

  const theme = useTheme();

  const { setTraining, component, setComponent, setSelectedExercises } =
    useTrainerDayViewContext();

  return (
    <Box display="flex" p={0}>
      {trainingComponent.component && (
        <Box
          display="flex"
          alignItems="center"
          sx={{ cursor: 'pointer', p: 0, m: 0 }}
          onClick={() => {
            if (trainingComponent && !component) {
              setTraining(training);
              setComponent(trainingComponent);
            }
            setSelectedExercises([]);
          }}
        >
          {trainingComponent?.id === component?.id ? (
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
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    width: 5,
                    height: 20,
                    borderRadius: 5,
                  }}
                />
              </IconButton>
            </Tooltip>
          ) : (
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                width: 5,
                height: 20,
                borderRadius: 5,
              }}
            />
          )}
          <Typography
            variant="body2"
            fontSize={15}
            noWrap
            sx={{
              color: theme.palette.primary.main,
              pl: 1,
              mb: 0,
              textTransform: 'uppercase',
              fontWeight: 350,
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
              setSelectedExercises([]);
            }}
          >
            {trainingComponent.target
              ? `${trainingComponent.component.name} - ${trainingComponent.target.name}`
              : trainingComponent.component.name}
          </Typography>
          {component?.id === trainingComponent.id && (
            <IconButton
              sx={{ p: 0, m: 0, ml: 1 }}
              onClick={() => setExpandedExercisesView((prev) => !prev)}
            >
              {expandedExercisesView ? (
                <KeyboardArrowDown />
              ) : (
                <KeyboardArrowRight />
              )}
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
}
