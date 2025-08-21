import { MonitorHeart, Visibility, VisibilityOff } from '@mui/icons-material';
import { DoNotDisturb } from '@mui/icons-material';
import { Box, Menu, MenuItem } from '@mui/material';

import TrainingComponentHeaderMenu from '../training-component-header-menu/training-component-header-menu';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { ComponentIds } from '@/common/enum/component-ids.enum';
import type { SetState } from '@/common/type/state.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent as TrainingComponentClass } from '@/controller/training/type/training-component.type';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface TrainingComponentMenuProps {
  trainingComponent: TrainingComponentClass;
  heatmapView: boolean;
  setHeatmapView: SetState<boolean>;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  training: Training;
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
  } = props;

  const screenSize = useScreenSize();

  const {
    training: selectedTraining,
    setTraining,
    component,
    setComponent,
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

      {component?.id === trainingComponent.id &&
        trainingComponent.id === ComponentIds.STRENGTH && (
          <Box
            sx={{
              cursor: 'pointer',
              px: 1,
            }}
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
                    fontSize: 20,
                  }}
                />
                <MonitorHeart sx={{ fontSize: 20, opacity: 0.5 }} />
              </>
            ) : (
              <>
                <MonitorHeart sx={{ fontSize: 20 }} />
              </>
            )}
          </Box>
        )}

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
      </Menu>
    </Box>
  );
}
