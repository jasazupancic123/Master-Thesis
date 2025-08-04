'use client';

import { Box, Grid2, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import AddExerciseForm from '../add-exercise-form/add-exercise-form';
import MyModal from '../modal/modal';
import Superset from '../superset/superset';
import { NUM_MAX_SUPERSETS } from '../trainer-day-view/constant';
import { onDragEnd } from '../trainer-day-view/state';
import { handleAddExerciseToSupersetComponent } from './state';
import type { SetState } from '@/common/type/state.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { SupersetsProvider } from '@/store/supersets-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function Supersets(props: SupersetsProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const {
    openAddExerciseModal,
    setOpenAddExerciseModal,
    expandedExercisesView,
    setExpandedExercisesView,
  } = props;

  const { exercises: allExercises } = useMain();
  const { setDetectedChanges } = useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    setSearch,
    supersets,
    setSupersets,
    setPagination,
  } = useTrainerDayViewContext();

  const { setTrainings } = useGroup();

  const [selectedExercisesIds, setSelectedExercisesIds] = useState(
    supersets && supersets.length
      ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
      : []
  );
  const [selectedExercise, setSelectedExercise] =
    useState<TrainingExercise | null>(null);

  const [setsNumbers, setSetsNumbers] = useState<
    {
      exerciseId: string;
      setsNumber: number;
    }[]
  >([]);

  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);

  const [menuExercise, setMenuExercise] = useState<TrainingExercise | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!selectedSubgroup?.subgroup?.supersets && !component)
      setSelectedExercisesIds([]);
  }, [component, selectedSubgroup]);

  if (!component || !training) return null;

  return (
    <DragDropContext
      onDragEnd={(input) =>
        onDragEnd(input, {
          training,
          setTraining,
          component,
          setComponent,
          selectedSubgroup,
          setSelectedSubgroup,
          supersets,
          setSupersets,
          setDetectedChanges,
        })
      }
    >
      <Grid2 container rowSpacing={2}>
        {/* Supersets */}
        <SupersetsProvider
          expandedExercisesView={expandedExercisesView}
          setExpandedExercisesView={setExpandedExercisesView}
          selectedExercise={selectedExercise}
          setSelectedExercise={setSelectedExercise}
          menuExercise={menuExercise}
          setMenuExercise={setMenuExercise}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          openVideoPlayerModal={openVideoPlayerModal}
          setOpenVideoPlayerModal={setOpenVideoPlayerModal}
          openAddExerciseModal={openAddExerciseModal}
          setOpenAddExerciseModal={setOpenAddExerciseModal}
          setsNumbers={setsNumbers}
          setSetsNumbers={setSetsNumbers}
        >
          {supersets &&
            supersets.map((superset, i) => (
              <Superset key={i} superset={superset} i={i} />
            ))}
        </SupersetsProvider>

        {/* Add new superset field */}
        {supersets.length < NUM_MAX_SUPERSETS && (
          <Grid2
            size={{ xs: 12, sm: screenSize.isLandscapeMobile ? 4 : 6, md: 3 }}
          >
            <Droppable
              key="addSupersetDroppable"
              droppableId="addSupersetDroppable"
              direction="vertical"
            >
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  border="1px dashed #B2B3B7"
                  borderRadius={2}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: theme.palette.background.dark,
                  }}
                  p={1}
                  py={!expandedExercisesView ? 2.25 : 8.75}
                  mx={1}
                  onClick={() => setOpenAddExerciseModal(true)}
                >
                  <Typography variant="body2" align="center" fontSize={12}>
                    Add/drop exercise
                  </Typography>
                </Box>
              )}
            </Droppable>
          </Grid2>
        )}
      </Grid2>

      {/* Component exercises modal */}
      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={(open) => setOpenAddExerciseModal(open)}
        cancelText="Close"
        onCancel={() => {
          const oldExercises = selectedExercisesIds.filter((id) =>
            supersets
              .map((s) => s.exercises.map((e) => e.id))
              .flat()
              .includes(id)
          );

          setPagination((prev) => ({
            ...prev,
            page: 1,
          }));
          setSelectedExercisesIds(oldExercises);
          setOpenAddExerciseModal(false);
          setSearch('');
        }}
        width={500}
        dialogueContentSx={{ px: screenSize.isMobile ? 0 : undefined }}
        onConfirm={() => {
          if (selectedExercisesIds.length === 0) {
            setOpenAddExerciseModal(false);
            return;
          }
          handleAddExerciseToSupersetComponent(
            {
              selectedExercisesIds,
              allExercises,
            },
            {
              training,
              setTraining,
              setTrainings,
              component,
              setComponent,
              supersets,
              setSupersets,
              setOpenAddExerciseModal,
              setDetectedChanges,
              setSearch,
              selectedSubgroup,
              setSelectedSubgroup,
              setPagination,
            }
          );
        }}
      >
        <AddExerciseForm
          selectedExercisesIds={selectedExercisesIds}
          setSelectedExercisesIds={setSelectedExercisesIds}
          component={component}
        />
      </MyModal>

      {/* Video Player Modal */}
      <MyModal
        isOpen={openVideoPlayerModal}
        setIsOpen={(open) => setOpenVideoPlayerModal(open)}
        cancelText="Close"
        onCancel={() => {
          setSelectedExercise(null);
          setOpenVideoPlayerModal(false);
        }}
      >
        {selectedExercise?.exercise?.videoUrl ? (
          <Box
            component="video"
            src={selectedExercise?.exercise?.videoUrl}
            controls
            sx={{
              width: '100%', // Make it responsive
              maxWidth: 600, // Limit max width
              borderRadius: 2, // Optional rounded corners
              boxShadow: 3, // Optional shadow
            }}
          />
        ) : (
          <Typography variant="body2">No video available</Typography>
        )}
      </MyModal>
    </DragDropContext>
  );
}
