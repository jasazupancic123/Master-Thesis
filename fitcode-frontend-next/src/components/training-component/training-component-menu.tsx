import { MonitorHeart } from '@mui/icons-material';
import { DoNotDisturb } from '@mui/icons-material';
import { Box } from '@mui/material';

import TrainingComponentHeaderMenu from './training-component-header-menu';
import type { SetState } from '@/lib/common/type/state.type';
import { ComponentIds } from '@/core/training/enum/component-ids.enum';
import type { TrainingComponent as TrainingComponentClass } from '@/core/training/type/training-component.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface TrainingComponentMenuProps {
  trainingComponent: TrainingComponentClass;
  heatmapView: boolean;
  setHeatmapView: SetState<boolean>;
}

export default function TrainingComponentMenu(
  props: TrainingComponentMenuProps
) {
  const { trainingComponent, heatmapView, setHeatmapView } = props;

  const screenSize = useScreenSize();

  const { training, setTraining, component, setComponent } =
    useTrainerDayView();

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
            trainingComponent.id === component.id && (
              <TrainingComponentHeaderMenu />
            )}
        </Box>
      )}

      {component?.id === trainingComponent.id &&
        trainingComponent.id === ComponentIds.STRENGTH && (
          <Box
            id="strength-menu"
            display="flex"
            alignItems="center"
            sx={{
              cursor: 'pointer',
              px: 1,
              position: screenSize.isSmallerThanLaptop ? 'absolute' : undefined,
              right: screenSize.isSmallerThanLaptop ? 0 : undefined,
              top: screenSize.isSmallerThanLaptop ? -36 : undefined,
            }}
            onClick={() => {
              if (
                trainingComponent &&
                component &&
                trainingComponent.id === component.id &&
                heatmapView
              ) {
                setHeatmapView(false);
                return;
              }
              if (!component || trainingComponent.id !== component.id) {
                setTraining(training);
                setComponent(trainingComponent);
              }

              setHeatmapView(true);
            }}
          >
            {trainingComponent &&
            component &&
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
    </Box>
  );
}
