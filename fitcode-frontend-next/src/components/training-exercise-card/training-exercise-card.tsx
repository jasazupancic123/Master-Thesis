import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import MyModal from '../modal/modal';
import type { TrainingExerciseCardProps } from '../trainer-day-view/props';
import TrainingExerciseCardCollapsedSets from './components/training-exercise-card-sets/components/training-exercise-card-sets-collapsed/training-exercise-card-collapsed-sets';
import TrainingExerciseCardExpandedSets from './components/training-exercise-card-sets/components/training-exercise-card-sets-expanded/training-exercise-card-expanded-sets';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import useTrainingExerciseCardParams from './hooks/use-params';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const {
    menuExercise,
    setMenuExercise,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    expandedExercisesView,
  } = useSupersets();

  const { training, component } = useTrainerDayViewContext();

  const { selectedExercises, setSelectedExercises } =
    useTrainerDayViewContext();

  const { params, componentIndex } = useTrainingExerciseCardParams(props);

  const { supersetIndex, chartView, exercise } = props;

  const [expandedSetsView, setExpandedSetsView] = useState(false);

  if (!training || !component || !params) return null;

  return (
    <Stack
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={expandedExercisesView ? 2 : 1}
      gap={1}
      sx={{
        width: '100% !important',
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '5px',
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Background Overlay */}
      <Box
        sx={{
          width: '100% !important',
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: selectedExercises.some((ex) => ex.id === exercise.id)
            ? theme.palette.background.darkBorder
            : theme.palette.background.light,
          zIndex: 0,
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return; // Prevents click on child elements

          if (!selectedExercises.some((ex) => ex.id === exercise.id)) {
            setSelectedExercises((prev) => [...prev, exercise]);
          } else {
            setSelectedExercises((prev) =>
              prev.filter((ex) => ex.id !== exercise.id)
            );
          }
        }}
      />

      <Stack direction="row" justifyContent="center" sx={{ mt: 0 }}>
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            fontWeight={700}
            fontSize={12}
            textTransform="uppercase"
            color={theme.palette.text.primary}
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '75%',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => {
              if (!selectedExercises.some((ex) => ex.id === exercise.id)) {
                setSelectedExercises((prev) => [...prev, exercise]);
              } else {
                setSelectedExercises((prev) =>
                  prev.filter((ex) => ex.id !== exercise.id)
                );
              }
            }}
          >
            {exercise.exercise?.name}
          </Typography>
        </Tooltip>

        {/* <ExerciseMembersInProgress
          trainingMembersLength={training.membersIds.length}
          componentId={component.id}
          supersetIndex={supersetIndex}
          exerciseId={exercise.id}
        /> */}
      </Stack>

      {expandedExercisesView &&
        (chartView ? (
          <></>
        ) : !expandedSetsView ? (
          <TrainingExerciseCardCollapsedSets
            component={component}
            exercise={exercise}
            expandedSetsView={expandedSetsView}
            setExpandedSetsView={setExpandedSetsView}
            componentIndex={componentIndex}
          />
        ) : (
          <TrainingExerciseCardExpandedSets
            component={component}
            exercise={exercise}
            expandedSetsView={expandedSetsView}
            setExpandedSetsView={setExpandedSetsView}
            supersetIndex={supersetIndex}
          />
        ))}
      <MyModal
        isOpen={openVideoPlayerModal}
        setIsOpen={(open) => setOpenVideoPlayerModal(open)}
        cancelText="Close"
        onCancel={() => {
          setMenuExercise(null);
          setOpenVideoPlayerModal(false);
        }}
        sx={{
          p:
            menuExercise?.exercise?.videoUrl &&
            menuExercise?.exercise?.videoUrl.length > 0
              ? 0
              : undefined,
        }}
        dialogueContentSx={{
          p:
            menuExercise?.exercise?.videoUrl &&
            menuExercise?.exercise?.videoUrl.length > 0
              ? 0
              : undefined,
        }}
      >
        {menuExercise?.exercise?.videoUrl &&
        menuExercise?.exercise?.videoUrl.length > 0 ? (
          <Box
            component="video"
            src={menuExercise?.exercise?.videoUrl}
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
    </Stack>
  );
}
