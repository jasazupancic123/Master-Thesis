import { useGroup } from '@/store/group-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Delete,
  MonitorHeart,
  MoreVert,
  Timeline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import { CalendarIcon } from '@mui/x-date-pickers';
import { DoNotDisturb } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { TrainingComponent as TrainingComponentClass } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { SetState } from '@/common/type/state.type';

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
    setOpenPeriodizationModal,
    setOpenCalendarModal,
  } = props;

  const { detectedChanges, setDetectedChanges } = useGroup();

  const {
    training: selectedTraining,
    setTraining,
    component,
    setComponent,
    setTodaysTrainings,
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
    } else {
      setTraining(training);
      setComponent(trainingComponent);
    }
    setHeatmapView(false);
    handleMenuClose();
  };

  return (
    <Box position="absolute" right={0} top={10}>
      <IconButton sx={{ p: 0 }} onClick={handleMenuOpen}>
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleToggleVisibility}>
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
                if (detectedChanges) {
                  toast.error('Save training before periodization', {
                    icon: '⚠️',
                    duration: 1000,
                  });
                  return;
                }
                setOpenPeriodizationModal(true);
                handleMenuClose();
              }}
            >
              <Timeline sx={{ mr: 1 }} /> Periodize
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (detectedChanges) {
                  toast.error('Save training before copying', {
                    icon: '⚠️',
                    duration: 1000,
                  });
                  return;
                }

                if (!component || trainingComponent.id !== component.id) {
                  setTraining(training);
                  setComponent(trainingComponent);
                }

                setOpenCalendarModal(true);
                handleMenuClose();
              }}
            >
              <CalendarIcon sx={{ mr: 1 }} /> Component Calendar
            </MenuItem>

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
                const newTraining = { ...training };
                newTraining.components = newTraining.components.filter(
                  (c) => c.id !== trainingComponent.id
                );
                newTraining.avgFutureWorkloadValues =
                  newTraining.avgFutureWorkloadValues.filter(
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
