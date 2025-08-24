'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Grid2, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import AddExerciseForm from '../add-exercise-form/add-exercise-form';
import MyModal from '../modal/modal';
import Superset from '../superset/superset';
import { NUM_MAX_SUPERSETS } from '../trainer-day-view/constant';
import { onDragEnd as onRBDDragEnd } from '../trainer-day-view/state';
import StubTrainingExerciseCard from '../training-exercise-card/stub-training-exercise-card';
import { handleAddExerciseToSupersetComponent } from './state';
import { ADD_SUPERSET_DROPPABLE_ID } from '@/common/constant/add-superset-droppable-id.constant';
import type { SetState } from '@/common/type/state.type';
import { VolWorkSetType } from '@/controller/component/enum/param.enum';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Superset as SupersetType } from '@/controller/training/type/superset.type';
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

  const { exercises: allExercises } = useMain();
  const { setDetectedChanges } = useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    setCustomAthleteWorkloads,
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

  const [activeExercise, setActiveExercise] = useState<TrainingExercise | null>(
    null
  );

  const isCircuit =
    (selectedSubgroup || component)?.mainSet === MainSet.CIRCUIT;

  useEffect(() => {
    if (!component) return;

    const updatedSupersets = [{ exercises: [] }] as SupersetType[];

    const mainSet = selectedSubgroup?.mainSet || component.mainSet;

    const exercises = (selectedSubgroup || component).supersets.flatMap(
      (s) => s.exercises
    );

    if (mainSet === MainSet.BLOCK) {
      exercises.forEach((e, i) => {
        // limit to 32 exercises
        if (i > 31) return;

        if (
          updatedSupersets[updatedSupersets.length - 1].exercises.length === 4
        )
          updatedSupersets.push({
            exercises: [],
          });

        updatedSupersets[updatedSupersets.length - 1].exercises.push(e);
      });
    } else {
      // circuit
      exercises.forEach((e, i) => {
        // limit to 32 exercises
        if (i > 31) return;

        updatedSupersets[0].exercises.push(e);
      });
    }

    const updatedComponent = { ...component };
    if (selectedSubgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup,
        supersets: updatedSupersets,
      };
      setSelectedSubgroup(updatedSubgroup);

      component.subgroups = component.subgroups.map((s) =>
        s.id === updatedSubgroup.id ? updatedSubgroup : s
      );
    } else updatedComponent.supersets = updatedSupersets;

    setComponent(updatedComponent);

    setTraining((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        components: prev.components.map((c) =>
          c.id === updatedComponent.id ? updatedComponent : c
        ),
      };
    });
  }, [component?.mainSet, selectedSubgroup?.mainSet]);

  useEffect(() => {
    setSelectedExercisesIds(
      supersets && supersets.length
        ? supersets.flatMap((s) => s.exercises.map((e) => e.id))
        : []
    );
  }, [supersets, supersets.length]);

  useEffect(() => {
    if (!selectedSubgroup && !component) setSelectedExercisesIds([]);
  }, [component, selectedSubgroup]);

  // update setsNumbers on method change
  useEffect(() => {
    if (!component || !component.method) return;

    const setsRange = component.method?.attributes
      ?.map((a) => a.options?.find((o) => o.field === VolWorkSetType.Set))
      .find(Boolean);

    if (!setsRange) return;

    const { min, max } = setsRange;

    if (min === undefined && max === undefined) return;

    setSetsNumbers((prev) => {
      const newSetsNumbers = prev.map((item) => {
        return {
          ...item,
          setsNumber: Math.max(
            min || 0,
            Math.min(max || 1000, item.setsNumber)
          ),
        };
      });
      return newSetsNumbers;
    });
  }, [component?.method]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getContainerIdForSupersetIndex = (i: number) => `${component!.id}-${i}`;

  const itemsByContainer = useMemo(() => {
    if (!component) return {} as Record<string, string[]>;
    const map: Record<string, string[]> = {};
    supersets?.forEach((s, i) => {
      map[getContainerIdForSupersetIndex(i)] = s.exercises.map((e) => e.id);
    });
    return map;
  }, [supersets, component]);

  if (!component || !training) return null;

  // Adapter: convert dnd-kit events to react-beautiful-dnd DropResult shape our existing onDragEnd expects
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

    // Special case: add-superset droppable
    if (destinationDroppableId === ADD_SUPERSET_DROPPABLE_ID) {
      // mimic RBD shape where droppableId is the add area
      const input = {
        draggableId: String(active.id),
        destination: {
          droppableId: destinationDroppableId,
          index: destinationIndex!,
        },
      };

      onRBDDragEnd(input, {
        training,
        setTraining,
        component,
        setComponent,
        selectedSubgroup,
        setSelectedSubgroup,
        supersets,
        setSupersets,
        setDetectedChanges,
        setCustomAthleteWorkloads,
      });
      return;
    }

    if (
      !sourceDroppableId ||
      destinationDroppableId === undefined ||
      sourceIndex === undefined ||
      destinationIndex === undefined
    )
      return;

    const input = {
      draggableId: String(active.id),
      destination: {
        droppableId: destinationDroppableId,
        index: destinationIndex,
      },
    };

    onRBDDragEnd(input, {
      training,
      setTraining,
      component,
      setComponent,
      selectedSubgroup,
      setSelectedSubgroup,
      supersets,
      setSupersets,
      setDetectedChanges,
      setCustomAthleteWorkloads,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        const id = String(e.active.id);
        const found =
          supersets.flatMap((s) => s.exercises).find((ex) => ex.id === id) ||
          null;
        setActiveExercise(found);
      }}
      onDragEnd={adaptAndCallOnDragEnd}
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
          openVideoPlayerModal={openVideoPlayerModal}
          setOpenVideoPlayerModal={setOpenVideoPlayerModal}
          openAddExerciseModal={openAddExerciseModal}
          setOpenAddExerciseModal={setOpenAddExerciseModal}
          setsNumbers={setsNumbers}
          setSetsNumbers={setSetsNumbers}
        >
          {supersets &&
            supersets.map((superset, i) => (
              <Superset key={i} superset={superset} supersetIndex={i} />
            ))}
        </SupersetsProvider>

        {/* Add new superset field */}
        {supersets.length === 1 && supersets[0].exercises.length === 0
          ? null
          : supersets.length < NUM_MAX_SUPERSETS && (
              <Grid2
                size={{
                  xs: 12,
                  sm: screenSize.isLandscapeMobile ? 4 : 6,
                  md: 3,
                }}
                sx={{
                  mx: isCircuit ? 'auto' : undefined,
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
                      mx: isCircuit ? 0 : 1,
                    }}
                    p={1}
                    py={!expandedExercisesView ? 2.25 : 3}
                    onClick={() => setOpenAddExerciseModal(true)}
                  >
                    <Typography variant="body2" align="center" fontSize={12}>
                      {isCircuit ? 'Add exercise' : 'Add/drop exercise'}
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
            }}
          >
            <StubTrainingExerciseCard
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

          const setsRange = component.method?.attributes
            ?.map((a) => a.options?.find((o) => o.field === VolWorkSetType.Set))
            .find(Boolean);

          handleAddExerciseToSupersetComponent(
            {
              selectedExercisesIds,
              allExercises,
              minSets: setsRange?.min,
              maxSets: setsRange?.max,
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
    </DndContext>
  );
}
