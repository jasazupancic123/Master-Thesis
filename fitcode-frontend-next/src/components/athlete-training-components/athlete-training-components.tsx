import { COLOR } from '@/common/constant/browser.constant';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import {
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { CheckCircle } from '@mui/icons-material';
import SportsIcon from '@mui/icons-material/Sports';
import { Box, IconButton, Tooltip } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import BorderColor from '../border-color/border-color';
import { useTheme } from '@mui/material';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { SetState } from '@/common/type/state.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import AthleteTrainingExercise from '../athlete-training-exercise/athlete-training-exercise';

interface AthleteTrainingComponentsProps {
  components: TrainingComponent[];
  training: Training;
  supersets: Superset[];
  profile: User;
  setOpenAreYouSureModal: SetState<boolean>;
  setOpenVideoPlayerModal: SetState<boolean>;
  setVideoUrl: SetState<string>;
}

export default function AthleteTrainingComponents(
  props: AthleteTrainingComponentsProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const {
    components,
    training,
    supersets,
    profile,
    setOpenAreYouSureModal,
    setOpenVideoPlayerModal,
    setVideoUrl,
  } = props;
  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const [selectedSuperset, setSelectedSuperset] = useState<Superset | null>(
    null
  );
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);

  useEffect(() => {
    if (!selectedSuperset) return;
    const newExercises = selectedSuperset.exercises;
    setSelectedExercises(newExercises);
    if (!newExercises || newExercises.length === 0) return;

    //TODO()
  }, [selectedSuperset]);

  return components.map((c, i, arr) =>
    c.id === trainingInProgress?.selectedComponent?.id &&
    training.id === trainingInProgress?.training?.id ? (
      <Box
        key={c.id}
        display="flex"
        flexDirection="column"
        sx={{
          p: 0,
          pt: 0.5,
          m: 0,
          border: `1px solid ${theme.palette.primary.main}`,
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          width="100%"
          key={`${c.id}`}
          sx={{
            py: 1,
            position: 'relative',
          }}
        >
          <Tooltip
            title={c.id[0].toUpperCase() + c.id.slice(1)}
            placement="top"
          >
            <Typography
              variant="h6"
              sx={{
                textTransform: 'uppercase',
                color: theme.palette.primary.main,
                textAlign: 'center !important',
                cursor: 'pointer',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                px: 7,
                maxWidth: '100%', // Adjust width as needed
              }}
              onClick={() => {
                setTrainingInProgress(null);
              }}
            >
              {c.id}
            </Typography>
          </Tooltip>
          <IconButton
            sx={{
              p: 0,
              m: 0,
              position: 'absolute',
              top: 7,
              left: 12,
            }}
            onClick={() => setOpenAreYouSureModal(true)}
          >
            <SportsIcon sx={{ fontSize: 35 }} />
          </IconButton>
        </Box>
        <CardContent
          sx={{
            px: 2,
            pt: 0.5,
          }}
        >
          <Box display="flex" flexDirection="column" gap={2}>
            {supersets?.map((superset, i) => (
              <Box
                key={`superset-${trainingInProgress?.selectedComponent.id}-${i}`}
                display="flex"
                flexDirection="column"
                gap={0.25}
              >
                <BorderColor
                  color={COLOR[i % COLOR.length]}
                  applyMargin
                  marginValue={superset.exercises.length === 0 ? '3px' : '2px'}
                />

                {superset.exercises.map((exercise, exerciseIndex) => (
                  <AthleteTrainingExercise
                    key={`${exercise.id}-${exerciseIndex}`}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    superset={superset}
                    selectedSuperset={selectedSuperset}
                    setSelectedSuperset={setSelectedSuperset}
                    selectedExercises={selectedExercises}
                    setSelectedExercises={setSelectedExercises}
                    setOpenVideoPlayerModal={setOpenVideoPlayerModal}
                    setVideoUrl={setVideoUrl}
                  />
                ))}

                {superset.exercises.length === 0 && (
                  <BorderColor
                    color={COLOR[i % COLOR.length]}
                    lower
                    applyMargin
                    marginValue={
                      superset.exercises.length === 0 ? '3px' : '5px'
                    }
                  />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Box>
    ) : (
      <Box
        key={`${c.id}`}
        width="100%"
        sx={{
          backgroundColor: c.completedMembersIds.includes(profile.uid)
            ? theme.palette.background.dark
            : theme.palette.background.paper,
          py: 1,
          borderTopRightRadius: i === 0 ? 5 : 0,
          borderBottomRightRadius: i === arr.length - 1 ? 5 : 0,
          borderBottomLeftRadius: i === arr.length - 1 ? 5 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => {
          if (c.completedMembersIds.includes(profile.uid)) return;
          if (!trainingInProgress) {
            setTrainingInProgress({
              training: training,
              selectedComponent: c,
              userId: profile.uid,
            } as AthleteTrainingInProgress);
          } else {
            setTrainingInProgress(
              (prev) =>
                ({
                  ...prev,
                  training: training,
                  selectedComponent: c,
                  userId: profile.uid,
                }) as AthleteTrainingInProgress
            );
          }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            textTransform: 'uppercase',
            color: theme.palette.text.primary,
            textAlign: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            px: 1,
            maxWidth: '100%', // Adjust width as needed
          }}
        >
          {c.id}
        </Typography>
        <CheckCircle
          sx={{
            position: 'absolute',
            right: 10,
            color: theme.palette.primary.main,
            display: c.completedMembersIds.includes(profile.uid)
              ? undefined
              : 'none',
          }}
        />
      </Box>
    )
  );
}
