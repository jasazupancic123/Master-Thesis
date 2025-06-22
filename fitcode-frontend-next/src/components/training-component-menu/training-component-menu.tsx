import { useGroup } from '@/store/group-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Close,
  DateRange,
  Delete,
  MonitorHeart,
  MoreVert,
  Timeline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import { DoNotDisturb } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { TrainingComponent as TrainingComponentClass } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { SetState } from '@/common/type/state.type';
import TrainingComponentExpanded from '../training-component-expanded/training-component-expanded';
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
    setTodaysTrainings,
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
      setTraining(undefined);
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
    <Box display="flex" alignItems="center" position="absolute" right={0}>
      {!screenSize.isMobile && (
        <Box
          display="flex"
          width={screenSize.isMobile ? '100%' : undefined}
          p={0}
          mr={1}
          alignItems="center"
          flexDirection={screenSize.isMobile ? 'column' : 'row'}
        >
          {trainingComponent &&
            component &&
            selectedTraining?.id === training.id &&
            trainingComponent.id === component.id && (
              <TrainingComponentExpanded
                training={training}
                trainingComponent={trainingComponent}
              />
            )}
        </Box>
      )}

      {trainingComponent?.component &&
        ![WARMUP_ID, COOLDOWN_ID].includes(trainingComponent.component.id) && (
          <IconButton
            onClick={() => {
              if (detectedChanges) {
                toast.error('Save training first', {
                  icon: '⚠️',
                  duration: 3000,
                });
                return;
              }

              if (!component || trainingComponent.id !== component.id) {
                setTraining(training);
                setComponent(trainingComponent);
              }

              setOpenCalendarModal(true);
            }}
            sx={{
              p: 0,
              m: 0,
            }}
          >
            <DateRange fontSize="small" />
          </IconButton>
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
                setTodaysTrainings((prev) =>
                  prev.map((t) => (t.id === training.id ? newTraining : t))
                );
                setSelectedExercises([]);
                setDetectedChanges(true);
                handleMenuClose();
              }}
            >
              <Close sx={{ mr: 1 }} /> Delete Selected Exercises
            </MenuItem>

            <MenuItem
              onClick={() => {
                const newTraining = { ...training };
                newTraining.components = newTraining.components.filter(
                  (c) => c.id !== trainingComponent.id
                );
                newTraining.futureStats = newTraining.futureStats.filter(
                  (c) => c.rootComponentId !== trainingComponent.component?.id
                );
                setTraining(newTraining);
                setTodaysTrainings((prev) =>
                  prev.map((t) => (t.id === training.id ? newTraining : t))
                );
                setDetectedChanges(true);
                handleMenuClose();
              }}
            >
              <Delete sx={{ mr: 1 }} /> Delete Component
            </MenuItem>
          </Box>
        )}
      </Menu>
    </Box>
  );
}
