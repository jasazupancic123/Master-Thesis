import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { TrainingExerciseCardProps } from '../trainer-day-view/props';
import { useScreenSize } from '@/store/screen-size-provider';
import { useGroup } from '@/store/group-provider';
import { updateTraining } from './state';
import TrainingExerciseCardCollapsedSets from '../training-exercise-card-sets-collapsed/training-exercise-card-collapsed-sets';
import TrainingExerciseCardExpandedSets from '../training-exercise-card-sets-expanded/training-exercise-card-expanded-sets';
import { useTheme } from '@mui/material';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useSupersets } from '@/store/supersets-provider';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const {
    setSelectedExercise,
    setOpenVideoPlayerModal,
    setsNumbers,
    expandedExercisesView,
  } = useSupersets();

  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setSupersets,
  } = useTrainerDayViewContext();

  const { setDetectedChanges } = useGroup();
  const { setTraining, supersets, selectedExercises } =
    useTrainerDayViewContext();

  const [isInited, setIsInited] = useState(false);

  const { supersetIndex, chartView, exercise } = props;

  // const [exercise, setExercise] = useState(propsExercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const isSetNumberInitedRef = useRef(false);

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValuesL?.map((pv) =>
      Array.isArray(exercise.params)
        ? exercise?.params?.find((p) => p.field === pv.field)
        : Object.values(exercise.params).find((p: any) => p.field === pv.field)
    ) ||
    []?.filter((p) => p) ||
    [];

  if (!training || !component || !params) return null;

  useEffect(() => {
    if (!isSetNumberInitedRef.current) {
      isSetNumberInitedRef.current = true;
      return;
    }

    if (
      selectedExercises.length &&
      selectedExercises.some((e) => e.id === exercise.id)
    ) {
      const updatedExercises = [] as TrainingExercise[];
      for (const selectedExercise of selectedExercises) {
        const newSets = setsNumbers.find(
          (s) => s.exerciseId === selectedExercise.id
        )?.setsNumber;

        if (newSets === undefined || newSets === null) return;

        if (newSets > 16 || newSets < 1) return;

        const prevSets = selectedExercise.sets.length;

        let newExercise;
        if (prevSets > newSets) {
          // remove sets
          newExercise = {
            ...selectedExercise,
            sets: [...selectedExercise.sets].slice(0, newSets),
            params: [...selectedExercise.params],
          };
        } else {
          // add sets to the end
          const paramValues = selectedExercise.sets[
            selectedExercise.sets.length - 1
          ].paramValuesL.map((pv) => ({ ...pv }));

          newExercise = {
            ...selectedExercise,
            sets: [
              ...selectedExercise.sets,
              ...Array.from({ length: newSets - prevSets }, (_, i) => ({
                setNumber: prevSets + i + 1,
                paramValuesL: paramValues,
                paramValuesR: paramValues,
              })),
            ],
          };
        }

        updatedExercises.push(newExercise);
      }

      updateTraining(
        { exercises: updatedExercises },
        {
          training,
          component,
          supersets,
          setDetectedChanges,
          selectedSubgroup,
          setSelectedSubgroup,
          setTraining,
          isInited,
          setIsInited,
        }
      );
    } else {
      const newSets = setsNumbers.find(
        (s) => s.exerciseId === exercise.id
      )?.setsNumber;

      if (newSets === undefined || newSets === null) return;

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
        { exercises: [newExercise] },
        {
          training,
          component,
          setTraining,
          supersets,
          setDetectedChanges,
          selectedSubgroup,
          setSelectedSubgroup,
          setSupersets,
          isInited,
          setIsInited,
        }
      );
    }
  }, [setsNumbers]);

  return (
    <Stack
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={expandedExercisesView ? 2 : 1}
      gap={1}
      sx={{
        width: '100% !important',
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : theme.palette.background.default,
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
          backgroundColor: theme.palette.background.dark,
          zIndex: 0,
          opacity: 100,
        }}
      />

      <Stack
        direction="row"
        justifyContent="center"
        sx={{ cursor: 'pointer', mt: 0 }}
        onClick={() => {
          setSelectedExercise(exercise);
          setOpenVideoPlayerModal(true);
        }}
      >
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
          >
            {exercise.exercise?.name}
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
            supersetIndex={supersetIndex}
            i={i}
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
    </Stack>
  );
}
