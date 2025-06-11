import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { TrainingExerciseCardProps } from '../trainer-day-view/props';
import { useScreenSize } from '@/store/screen-size-provider';
import { useGroup } from '@/store/group-provider';
import { updateTraining } from './state';
import TrainingExerciseCardCollapsedSets from '../training-exercise-card-sets-collapsed/training-exercise-card-collapsed-sets';
import TrainingExerciseCardExpandedSets from '../training-exercise-card-sets-expanded/training-exercise-card-expanded-sets';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();

  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setComponent,
    setTraining,
  } = useTrainerDayViewContext();

  const { filteredTrainings, setFilteredTrainings, setDetectedChanges } =
    useGroup();

  const {
    supersetIndex,
    setSelectedExercise,
    chartView,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
    exercise: propsExercise,
  } = props;

  const [exercise, setExercise] = useState(propsExercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const [setsNumber, setSetsNumber] = useState(props.exercise.sets.length);

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValuesL
      ?.map((pv) => exercise?.params?.find((p) => p.field === pv.field)!)
      ?.filter((p) => p) || [];

  if (!training || !component || !params) return null;

  useEffect(() => {
    if (propsExercise !== exercise) {
      setSetsNumber(propsExercise.sets.length);
      setExercise(propsExercise);
    }
  }, [propsExercise]);

  useEffect(() => {
    const newSets = setsNumber;
    if (newSets > 16 || newSets < 1) return;

    const prevSets = exercise.sets.length;

    let newExercise;
    if (prevSets > newSets) {
      // remove sets
      newExercise = {
        ...exercise,
        sets: [...exercise.sets].slice(0, newSets),
        params: [...exercise.params],
      };
    } else {
      // add sets to the end
      const paramValues = exercise.sets[
        exercise.sets.length - 1
      ].paramValuesL.map((pv) => ({ ...pv }));

      newExercise = {
        ...exercise,
        sets: [
          ...exercise.sets,
          ...Array.from({ length: newSets - prevSets }, (_, i) => ({
            setNumber: prevSets + i + 1,
            paramValuesL: paramValues,
            paramValuesR: paramValues,
          })),
        ],
      };
    }

    updateTraining(
      { exercise: newExercise },
      {
        training,
        component,
        setTraining,
        setComponent,
        supersets,
        setSupersetsWithAdd,
        filteredTrainings,
        setFilteredTrainings,
        setDetectedChanges,
        selectedSubgroup,
        setSelectedSubgroup,
        supersetIndex,
      }
    );
  }, [setsNumber]);

  return (
    <Stack
      spacing={1}
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={2}
      sx={{
        width: '100% !important',
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : exercise.exercise?.imageUrl
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.05)',
        backgroundImage:
          exercise.exercise?.imageUrl && !expandedSetsView
            ? `url(${exercise.exercise?.imageUrl})`
            : undefined,
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
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(38, 54, 70, 0.825)',
          zIndex: 0,
          opacity: 100,
        }}
      />

      <Stack
        direction="row"
        justifyContent="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          setSelectedExercise(exercise);
          setOpenVideoPlayerModal(true);
        }}
      >
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            fontWeight="bold"
            fontSize={14}
            textTransform="uppercase"
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
            {exercise.exercise?.name}
          </Typography>
        </Tooltip>
      </Stack>

      {chartView ? (
        <></>
      ) : !expandedSetsView ? (
        <TrainingExerciseCardCollapsedSets
          exercise={exercise}
          setExercise={setExercise}
          expandedSetsView={expandedSetsView}
          setExpandedSetsView={setExpandedSetsView}
          supersets={supersets}
          setSupersetsWithAdd={setSupersetsWithAdd}
          setsNumber={setsNumber}
          setSetsNumber={setSetsNumber}
          i={i}
          supersetIndex={supersetIndex}
        />
      ) : (
        <TrainingExerciseCardExpandedSets
          exercise={exercise}
          expandedSetsView={expandedSetsView}
          setExpandedSetsView={setExpandedSetsView}
          supersets={supersets}
          setSupersetsWithAdd={setSupersetsWithAdd}
          supersetIndex={supersetIndex}
        />
      )}
    </Stack>
  );
}
