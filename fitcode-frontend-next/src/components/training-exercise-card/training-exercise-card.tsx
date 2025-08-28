import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';

import MyModal from '../modal/modal';
import { DEFAULT_SUBGROUP_ID } from '../trainer-day-view/constant';
import type { TrainingExerciseCardProps } from '../trainer-day-view/props';
import TrainingExerciseCardCollapsedSets from '../training-exercise-card-sets-collapsed/training-exercise-card-collapsed-sets';
import TrainingExerciseCardExpandedSets from '../training-exercise-card-sets-expanded/training-exercise-card-expanded-sets';
import {
  updateSelectedExercisesVolWorkSets,
  updateSingleExerciseVolWorkSets,
  updateTraining,
} from './state';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useSupersets } from '@/store/supersets-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const { exercises } = useMain();

  const {
    menuExercise,
    setMenuExercise,
    openVideoPlayerModal,
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
  const { setTraining, supersets, selectedExercises, setSelectedExercises } =
    useTrainerDayViewContext();

  const [isInited, setIsInited] = useState(false);

  const { supersetIndex, chartView, exercise } = props;

  // const [exercise, setExercise] = useState(propsExercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);

  const isSetNumberInitedRef = useRef(false);

  const componentIndex = training?.components.findIndex(
    (c) => c.id === component?.id
  );
  const selectedTrainingOrSubgroup =
    selectedSubgroup || training?.components?.[componentIndex!];
  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValuesL?.map((pv) =>
      Array.isArray(exercise.params)
        ? exercise?.params?.find((p) => p.field === pv.field)
        : Object.values(exercise.params).find(
            (p) => (p as Attribute).field === pv.field
          )
    ) ||
    []?.filter((p) => p) ||
    [];

  useEffect(() => {
    if (!training || !component || !params) return;

    if (!isSetNumberInitedRef.current) {
      isSetNumberInitedRef.current = true;
      return;
    }

    const foundExercise = exercises.find((e) => e.id === exercise.id);
    if (!foundExercise) return;

    if (
      selectedExercises.length &&
      selectedExercises.some((e) => e.id === exercise.id)
    ) {
      const updatedExercises = [] as TrainingExercise[];

      updateSelectedExercisesVolWorkSets({
        updatedExercises,
        selectedExercises,
        setsNumbers,
        exercises,
      });

      // if it's not a custom workload subgroup, find all custom workload subgroups and update
      // number of sets to the same value
      if (!selectedSubgroup?.parentId) {
        const customSubgroups = component.subgroups.filter(
          (sg) => sg.parentId === selectedSubgroup?.id || DEFAULT_SUBGROUP_ID
        );

        for (const subgroup of customSubgroups) {
          const subgroupExercises = subgroup.supersets.flatMap(
            (s) => s.exercises
          );

          const subgroupSelectedExercises = subgroupExercises.filter((ex) =>
            selectedExercises.some((e) => e.id === ex.id)
          );

          updateSelectedExercisesVolWorkSets({
            selectedExercises: subgroupSelectedExercises,
            setsNumbers,
            exercises,
          });
        }
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
      // paste here

      const updatedExercises = [] as TrainingExercise[]; // will contain only 1

      updateSingleExerciseVolWorkSets({
        updatedExercises,
        exercise,
        setsNumbers,
        foundExercise,
      });

      // if it's not a custom workload subgroup, find all custom workload subgroups and update
      // number of sets to the same value
      if (!selectedSubgroup?.parentId) {
        const customSubgroups = component.subgroups.filter(
          (sg) => sg.parentId === selectedSubgroup?.id || DEFAULT_SUBGROUP_ID
        );

        for (const subgroup of customSubgroups) {
          const subgroupExercises = subgroup.supersets.flatMap(
            (s) => s.exercises
          );

          const subgroupExercise = subgroupExercises.find(
            (ex) => ex.id === exercise.id
          );

          if (!subgroupExercise) continue;

          updateSingleExerciseVolWorkSets({
            exercise: subgroupExercise,
            setsNumbers,
            foundExercise,
          });
        }
      }

      updateTraining(
        { exercises: updatedExercises },
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
        backgroundColor: chartView ? 'transparent' : undefined,
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
            ? theme.palette.background.light
            : theme.palette.background.dark,
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
