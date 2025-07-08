import { useGroup } from '@/store/group-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  CheckBox,
  CheckBoxOutlineBlank,
  Close,
  DateRange,
  Delete,
  MonitorHeart,
  MoreVert,
  Timeline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Box, Checkbox, IconButton, Menu, MenuItem } from '@mui/material';
import { DoNotDisturb } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { TrainingComponent as TrainingComponentClass } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { SetState } from '@/common/type/state.type';
import TrainingComponentHeaderMenu from '../training-component-header-menu/training-component-header-menu';
import { useScreenSize } from '@/store/screen-size-provider';

interface TrainingComponentMenuProps {
  trainingComponent: TrainingComponentClass;
  heatmapView: boolean;
  setHeatmapView: SetState<boolean>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  training: Training;
  setOpenPeriodizationModal: SetState<boolean>;
  setOpenCalendarModal: SetState<boolean>;
}

export default function TrainingComponentMenu(
  props: TrainingComponentMenuProps
) {
  const {
    trainingComponent,
    heatmapView,
    setHeatmapView,
    anchorEl,
    setAnchorEl,
    training,
    setOpenCalendarModal,
  } = props;

  const screenSize = useScreenSize();
  const { detectedChanges, setDetectedChanges } = useGroup();

  const {
    training: selectedTraining,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedExercises,
    setSelectedExercises,
  } = useTrainerDayViewContext();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isWarmupOrCooldown = (component: TrainingComponentClass) => {
    return component.id === WARMUP_ID || component.id === COOLDOWN_ID;
  };

  const handleToggleVisibility = () => {
    if (
      trainingComponent &&
      component &&
      trainingComponent.id === component.id
    ) {
      setComponent(undefined);
      setSelectedExercises([]);
    } else {
      setTraining(training);
      setComponent(trainingComponent);
      setSelectedExercises([]);
    }
    setHeatmapView(false);
    handleMenuClose();
  };

  return (
    <Box display="flex" alignItems="center" position="absolute" right={-11.5}>
      {!screenSize.isSmallerThanLaptop && (
        <Box
          display="flex"
          width={screenSize.isSmallerThanLaptop ? '100%' : undefined}
          p={0}
          alignItems="center"
          flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
        >
          {trainingComponent &&
            component &&
            selectedTraining?.id === training.id &&
            trainingComponent.id === component.id && (
              <TrainingComponentHeaderMenu training={training} />
            )}
        </Box>
      )}

      <IconButton sx={{ p: 0 }} onClick={handleMenuOpen}>
        <MoreVert fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleToggleVisibility()}>
          {trainingComponent &&
          component &&
          training.id === selectedTraining?.id &&
          trainingComponent.id === component.id ? (
            <>
              <VisibilityOff sx={{ mr: 1 }} /> Hide Component
            </>
          ) : (
            <>
              <Visibility sx={{ mr: 1 }} /> Show Component
            </>
          )}
        </MenuItem>

        <MenuItem
          onClick={() => {
            const allExercisesSelected = trainingComponent.supersets?.every(
              (s) =>
                s.exercises.every((e) =>
                  selectedExercises.some((se) => se.id === e.id)
                )
            );
            if (allExercisesSelected) {
              setSelectedExercises([]);
            } else {
              setSelectedExercises(
                trainingComponent.supersets?.flatMap((s) => s.exercises) || []
              );
            }
          }}
        >
          {trainingComponent.supersets?.every((s) =>
            s.exercises.every((e) =>
              selectedExercises.some((se) => se.id === e.id)
            )
          ) ? (
            <>
              <CheckBoxOutlineBlank sx={{ mr: 1 }} /> Deselect All Exercises
            </>
          ) : (
            <>
              <CheckBox sx={{ mr: 1 }} /> Select All Exercises{' '}
            </>
          )}
        </MenuItem>

        {!isWarmupOrCooldown(trainingComponent) && (
          <Box>
            <MenuItem
              onClick={() => {
                if (
                  trainingComponent &&
                  component &&
                  training.id === selectedTraining?.id &&
                  trainingComponent.id === component.id &&
                  heatmapView
                ) {
                  setHeatmapView(false);
                  handleMenuClose();
                  return;
                }
                if (!component || trainingComponent.id !== component.id) {
                  setTraining(training);
                  setComponent(trainingComponent);
                }

                setHeatmapView(true);
                handleMenuClose();
              }}
            >
              {trainingComponent &&
              component &&
              training.id === selectedTraining?.id &&
              trainingComponent.id === component.id &&
              heatmapView ? (
                <>
                  <DoNotDisturb
                    sx={{
                      position: 'absolute',
                      fontSize: 22,
                    }}
                  />
                  <MonitorHeart sx={{ mr: 1, opacity: 0.5 }} /> Hide Heatmap
                </>
              ) : (
                <>
                  <MonitorHeart sx={{ mr: 1 }} /> Workout Heatmap
                </>
              )}
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (!selectedExercises.length || !component) return;

                const newComponent = { ...component };

                if (selectedSubgroup?.subgroup) {
                  const newSubgroup = { ...selectedSubgroup.subgroup };
                  newSubgroup.supersets = (newSubgroup.supersets || []).map(
                    (s) => ({
                      ...s,
                      exercises: s.exercises.filter(
                        (e) => !selectedExercises.some((se) => se.id === e.id)
                      ),
                    })
                  );

                  newSubgroup.supersets = newSubgroup.supersets.filter(
                    (s) => s.exercises.length > 0
                  );

                  setSelectedSubgroup((prev) =>
                    !prev
                      ? null
                      : {
                          ...prev,
                          subgroup: newSubgroup,
                        }
                  );
                  newComponent.subgroups = (newComponent.subgroups || []).map(
                    (sg) =>
                      sg.id === selectedSubgroup.subgroup?.id ? newSubgroup : sg
                  );
                } else {
                  newComponent.supersets = newComponent.supersets?.map((s) => ({
                    ...s,
                    exercises: s.exercises.filter(
                      (e) => !selectedExercises.some((se) => se.id === e.id)
                    ),
                  }));

                  newComponent.supersets = newComponent.supersets?.filter(
                    (s) => s.exercises.length > 0
                  );
                }

                const newTraining = { ...training };
                newTraining.components = newTraining.components.map((c) =>
                  c.id === component.id ? newComponent : c
                );

                setComponent(newComponent);
                setTraining(newTraining);
                setSelectedExercises([]);
                setDetectedChanges(true);
                handleMenuClose();
              }}
            >
              <Delete sx={{ mr: 1 }} /> Delete Selected Exercises
            </MenuItem>

            {/* <MenuItem
              onClick={() => {
                const newTraining = { ...training };
                newTraining.components = newTraining.components.filter(
                  (c) => c.id !== trainingComponent.id
                );
                newTraining.futureStats = newTraining.futureStats.filter(
                  (c) => c.rootComponentId !== trainingComponent.component?.id
                );
                setTraining(newTraining);
                setDetectedChanges(true);
                handleMenuClose();
              }}
            >
              <Delete sx={{ mr: 1 }} /> Delete Component
            </MenuItem> */}
          </Box>
        )}
      </Menu>
    </Box>
  );
}
