'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { Box, Grid2, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import AddExerciseForm from '../add-exercise-form/add-exercise-form';
import { NUM_MAX_SUPERSETS } from '../trainer-group-day-view/constant/supersets.constant';
import TrainingExerciseCardStub from '../training-exercise-card/components/card-stub';
import { onDragEndExercise } from './actions/actions-drag-exercise';
import Superset from './components/superset';
import useSupersetExercises from './hooks/use-exercises';
import useSelectedExerciseIds from './hooks/use-selected-exercises-ids';
import useSupersetUtils from './hooks/use-utils';
import { app } from '@/core/app.service';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/core/training/const/add-superset-droppable-id.const';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { SupersetsProvider } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import MyModal from '@/util/modal';

interface SupersetsProps {
  openAddExerciseModal: boolean;
  setOpenAddExerciseModal: SetState<boolean>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

// Simple droppable wrapper for areas that aren't Sortable containers
function DroppableArea({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      data-droppableid={id}
      style={{ outline: isOver ? '1px dashed rgba(0,0,0,0.2)' : undefined }}
    >
      {children}
    </div>
  );
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

  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const { exercises } = useMain();

  const {
    training,
    component,
    supersets,
    selectedAthlete,
    setSearch,
    setPagination,
  } = trainerDayViewContext;

  const { selectedExerciseIds, setSelectedExerciseIds } =
    useSelectedExerciseIds();

  const {
    menuExercise,
    setMenuExercise,
    activeExercise,
    setActiveExercise,
    selectedExercise,
    setSelectedExercise,
  } = useSupersetExercises();

  const {
    isCircuit,
    openVideoPlayerModal,
    setOpenVideoPlayerModal,
    sensors,
    disabledSensors,
    itemsByContainer,
  } = useSupersetUtils();

  if (!component || !training) return null;

  // This function needs to be here
  function adaptAndCallOnDragEnd(e: DragEndEvent) {
    if (!training || !component) return;

    setActiveExercise(null);
    const { active, over } = e;
    if (!over) return; // dropped outside

    // Source info comes from sortable data
    const srcSortable = active.data.current?.sortable;
    const sourceDroppableId = srcSortable?.containerId as string | undefined;
    const sourceIndex = srcSortable?.index as number | undefined;

    // Destination can be an item or a container
    let destinationDroppableId: string | undefined;
    let destinationIndex: number | undefined;

    const overSortable = over.data.current?.sortable;
    if (
      overSortable &&
      overSortable.containerId &&
      typeof overSortable.index === 'number'
    ) {
      destinationDroppableId = overSortable.containerId;
      destinationIndex = overSortable.index;
    } else {
      // over a container (empty space) — append to end
      destinationDroppableId = String(over.id);
      const destItems = itemsByContainer[destinationDroppableId] || [];
      destinationIndex = destItems.length;
    }

    if (
      !sourceDroppableId ||
      !destinationDroppableId ||
      sourceIndex === undefined ||
      destinationIndex === undefined
    )
      return;

    onDragEndExercise(
      String(active.id),
      { droppableId: destinationDroppableId, index: destinationIndex! },
      groupContext,
      { ...trainerDayViewContext, training, component }
    );
  }

  return (
    <DndContext
      sensors={selectedAthlete ? disabledSensors : sensors}
      collisionDetection={closestCenter}
      onDragEnd={selectedAthlete ? undefined : adaptAndCallOnDragEnd}
      onDragStart={
        selectedAthlete
          ? undefined
          : (e) => {
              const id = String(e.active.id);
              const found =
                supersets
                  .flatMap((s) => s.exercises)
                  .find((ex) => ex.id === id) || null;

              setActiveExercise(found);
            }
      }
    >
      <Grid2
        container
        rowSpacing={2}
        sx={{ mt: screenSize.isSmallerThanLaptop ? 2 : undefined }}
      >
        {/* Supersets */}
        <SupersetsProvider
          expandedExercisesView={expandedExercisesView}
          setExpandedExercisesView={setExpandedExercisesView}
          selectedExercise={selectedExercise}
          setSelectedExercise={setSelectedExercise}
          menuExercise={menuExercise}
          setMenuExercise={setMenuExercise}
          openVideoPlayerModal={openVideoPlayerModal}
          setOpenVideoPlayerModal={setOpenVideoPlayerModal}
          openAddExerciseModal={openAddExerciseModal}
          setOpenAddExerciseModal={setOpenAddExerciseModal}
        >
          {supersets &&
            supersets.map((superset, i) => (
              <Superset key={i} superset={superset} supersetIndex={i} />
            ))}
        </SupersetsProvider>

        {/* Add new superset field */}
        {selectedAthlete ||
        (supersets.length === 1 && supersets[0].exercises.length === 0)
          ? null
          : supersets.length < NUM_MAX_SUPERSETS && (
              <Grid2
                size={{
                  xs: 12,
                  sm: screenSize.isLandscapeMobile ? 4 : 12,
                  md: screenSize.isSmallerThanLaptop
                    ? 6
                    : screenSize.isLaptop
                      ? 4
                      : 3,
                }}
                sx={{
                  mx:
                    isCircuit &&
                    supersets.flatMap((s) => s.exercises).length >= 3 &&
                    !screenSize.isSmallerThanLaptop
                      ? 'auto'
                      : isCircuit && screenSize.isSmallerThanLaptop
                        ? 'auto'
                        : undefined,
                  my:
                    isCircuit &&
                    supersets.flatMap((s) => s.exercises).length < 4 &&
                    !screenSize.isSmallerThanLaptop
                      ? 'auto'
                      : undefined,
                }}
              >
                <DroppableArea
                  id={ADD_SUPERSET_DROPPABLE_ID}
                  disabled={isCircuit}
                >
                  <Box
                    border="1px dashed #B2B3B7"
                    borderRadius={2}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: theme.palette.background.dark,
                      mx:
                        isCircuit &&
                        supersets.flatMap((s) => s.exercises).length > 3
                          ? 0
                          : 1,
                    }}
                    p={1}
                    py={!expandedExercisesView ? 2.25 : 3}
                    onClick={() => setOpenAddExerciseModal(true)}
                  >
                    <Typography variant="body2" align="center" fontSize={12}>
                      {isCircuit ? 'Add exercises' : 'Add/drop exercises'}
                    </Typography>
                  </Box>
                </DroppableArea>
              </Grid2>
            )}
      </Grid2>

      <DragOverlay>
        {activeExercise ? (
          <Box
            sx={{
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: '0 1px 1px rgba(0,0,0,0.25)',
              border: `1px solid ${theme.palette.text.primary}`,
            }}
          >
            <TrainingExerciseCardStub
              exercise={activeExercise}
              expandedExercisesView={expandedExercisesView}
            />
          </Box>
        ) : null}
      </DragOverlay>

      {/* Component exercises modal */}
      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={(open) => setOpenAddExerciseModal(open)}
        cancelText="Close"
        onCancel={() => {
          const oldExercises = selectedExerciseIds.filter((id) =>
            supersets
              .map((s) => s.exercises.map((e) => e.id))
              .flat()
              .includes(id)
          );

          setPagination((prev) => ({ ...prev, page: 1 }));
          setSelectedExerciseIds(oldExercises);
          setOpenAddExerciseModal(false);
          setSearch('');
        }}
        PaperProps={{
          sx: {
            minWidth:
              screenSize.isMobile || screenSize.isTablet ? undefined : 1000,
            m: 0, // no margins around the dialog
          },
        }}
        dialogueContentSx={{
          minWidth:
            screenSize.isMobile || screenSize.isTablet ? undefined : 1000,
          px: screenSize.isMobile ? 0 : undefined,
        }}
        onConfirm={() => {
          if (selectedExerciseIds.length === 0) {
            setOpenAddExerciseModal(false);
            return;
          }

          const trainingExercises: TrainingExercise[] = selectedExerciseIds
            .filter((id) => exercises.some((e) => e.id === id))
            .map((id) => {
              const exercise = exercises.find((e) => e.id === id)!;
              return {
                id: exercise.id,
                params: [],
                exercise,
                sets: [
                  app.training.set.stub(1, exercise),
                  app.training.set.stub(2, exercise),
                  app.training.set.stub(3, exercise),
                ],
              };
            });

          trainerDayViewContext.addTrainingExercises(
            trainingExercises,
            MainSet.BLOCK
          );

          setOpenAddExerciseModal(false);
          setSearch('');
          setSelectedExerciseIds([]);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
      >
        <AddExerciseForm
          selectedExerciseIds={selectedExerciseIds}
          setSelectedExerciseIds={setSelectedExerciseIds}
          component={component}
        />
      </MyModal>
    </DndContext>
  );
}
