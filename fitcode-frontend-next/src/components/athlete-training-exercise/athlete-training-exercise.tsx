import { Superset } from '@/controller/training/type/superset.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';
import { ExerciseParam } from '../exercise-param/exercise-param';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTheme } from '@mui/material';

interface AthleteTrainingExerciseProps {
  exercise: TrainingExercise;
  exerciseIndex: number;
  superset: Superset;
  selectedSuperset: Superset | null;
  selectedExercises: TrainingExercise[];
  setSelectedSuperset: (superset: Superset | null) => void;
  setSelectedExercises: (exercises: TrainingExercise[]) => void;
  setOpenVideoPlayerModal: (open: boolean) => void;
  setVideoUrl: (url: string) => void;
}

export default function AthleteTrainingExercise(
  props: AthleteTrainingExerciseProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    exercise,
    exerciseIndex,
    superset,
    selectedSuperset,
    setSelectedSuperset,
    selectedExercises,
    setSelectedExercises,
    setOpenVideoPlayerModal,
    setVideoUrl,
  } = props;

  return (
    <Box
      key={`exercise-container-${exercise.id}`}
      display="flex"
      flexDirection="column" // Ensures vertical stacking
      sx={{
        position: 'relative',
        backgroundColor:
          selectedSuperset === superset
            ? exercise.exercise?.imageUrl
              ? 'rgba(0, 0, 0, 0.6)'
              : 'background.default'
            : 'background.default', // Darker background to improve contrast
        backgroundImage:
          selectedSuperset === superset
            ? exercise.exercise?.imageUrl
              ? `url(${exercise.exercise?.imageUrl})`
              : undefined
            : undefined,
        backgroundPosition:
          selectedSuperset === superset ? 'center' : undefined,
        backgroundSize: selectedSuperset === superset ? '100% auto' : undefined, // Ensures full width, height adjusts
        backgroundRepeat:
          selectedSuperset === superset ? 'no-repeat' : undefined,
        overflow: selectedSuperset === superset ? 'hidden' : undefined,
      }}
    >
      <Box
        key={exercise.id}
        display="flex"
        width="100%"
        justifyContent="center"
        alignItems="center"
        sx={{
          backgroundColor: exercise.exercise?.imageUrl
            ? 'transparent'
            : theme.palette.background.light, // Use theme color for better contrast
        }}
        py={0.5}
      >
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '80%', // Adjust width as needed
              zIndex: 10,
              cursor: superset === selectedSuperset ? 'pointer' : undefined,
            }}
            onClick={() => {
              if (superset === selectedSuperset) {
                setOpenVideoPlayerModal(true);
                setVideoUrl(exercise.exercise?.videoUrl || '');
              }
            }}
          >
            {exercise.exercise?.name || 'Unnamed Exercise'}
          </Typography>
        </Tooltip>

        {exerciseIndex === 0 && (
          <IconButton
            onClick={() => {
              if (superset === selectedSuperset) {
                setSelectedSuperset(null);
                setSelectedExercises([]);
              } else {
                setSelectedSuperset(superset);
              }
            }}
            sx={{
              py: 0,
              m: 0,
              position: 'absolute',
              right: screenSize.isMobile ? 14 : 20,
              zIndex: 11,
            }}
          >
            {selectedSuperset === superset ? (
              <VisibilityOffIcon />
            ) : (
              <VisibilityIcon />
            )}
          </IconButton>
        )}
      </Box>
      {selectedSuperset === superset && (
        <Box
          sx={{
            width: '100% !important',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.background.dark,
            zIndex: 0,
            opacity: 100,
          }}
        />
      )}
      {selectedExercises.includes(exercise) && (
        <Box
          key={`${exercise.id}-sets`}
          display="flex"
          flexDirection="column"
          width="100%"
          gap={1}
          p={1}
          pt={0}
        >
          {exercise.sets.map((set, i) => {
            return (
              <Box
                key={`set-${exercise.id}-${i}`}
                display="flex"
                width="100%"
                justifyContent="center"
                alignItems="center"
                gap={1}
              >
                {exercise.params.map((param, j) => {
                  const value = set.paramValuesL.find(
                    (pv) => pv.field === param.field
                  ) || {
                    field: param.field,
                    selected: 'set',
                    value: (i + 1).toString(),
                  };

                  return (
                    <Box
                      key={param.field}
                      flexBasis={
                        (100 / exercise.params.length).toString() + '%'
                      }
                    >
                      <ExerciseParam
                        readOnly={true}
                        showOptions={i === 0}
                        disableOptions
                        disableSets
                        param={param}
                        value={value}
                        onOptionChange={(newValue) => {}}
                        onSubOptionChange={(newValue) => {}}
                        athleteView
                      />
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
