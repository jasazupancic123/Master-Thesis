import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import type { TrainingExerciseCardProps } from '../trainer-group-day-view/props/props';
import TrainingExerciseCardCollapsedSets from './collapsed-sets';
import TrainingExerciseCardExpandedSets from './expanded-sets';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MyModal from '@/ui/modal';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const { supersetIndex, chartView, exercise } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  const [expandedSetsView, setExpandedSetsView] = useState(false);

  const { training, component } = useTrainerDayView();
  const { selectedExerciseIds, setSelectedExerciseIds } = useTrainerDayView();

  const {
    menuExercise,
    setMenuExercise,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    expandedExercisesView,
  } = useSupersets();

  if (!training || !component) return null;

  function handleSelect() {
    if (!selectedExerciseIds.some((ex) => ex === exercise.id))
      setSelectedExerciseIds((e) => [...e, exercise.id]);
    else setSelectedExerciseIds((e) => e.filter((ex) => ex !== exercise.id));
  }

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
          backgroundColor: selectedExerciseIds.some((ex) => ex === exercise.id)
            ? theme.palette.background.darkBorder
            : theme.palette.background.light,
          zIndex: 0,
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return; // prevents click on child elements
          handleSelect();
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
            onClick={handleSelect}
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '75%',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {exercise.exercise?.name || 'Invalid Exercise'}
          </Typography>
        </Tooltip>
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
            componentIndex={training.components.findIndex(
              (c) => c.id === component.id
            )}
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
        sx={{ p: menuExercise?.exercise?.videoUrl?.length ? 0 : undefined }}
        dialogueContentSx={{
          p: menuExercise?.exercise?.videoUrl?.length ? 0 : undefined,
        }}
      >
        {menuExercise?.exercise?.videoUrl?.length ? (
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
