import { Box, Collapse, Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import ComponentActionsModal from '../component-actions-modal/component-actions-modal';
import MyModal from '../modal/modal';
import MuscleHeatmapView from '../muscle-heatmap-view/muscle-heatmap-view';
import Supersets from '../supersets/supersets';
import type { TrainingComponentProps } from '../trainer-day-view/props';
import TrainingComponentCard from '../training-component-card/training-component-card';
import TrainingComponentHeaderMenu from '../training-component-header-menu/training-component-header-menu';
import TrainingComponentMenu from '../training-component-menu/training-component-menu';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Method } from '@/controller/method/type/method.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function TrainingComponentLayout(props: TrainingComponentProps) {
  const screenSize = useScreenSize();

  const { trainingComponent, day } = props;

  const { filter } = useGroup();

  const { training, component } = useTrainerDayViewContext();

  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [openCalendarModal, setOpenCalendarModal] = useState(false);
  const [heatmapView, setHeatmapView] = useState(false);
  const [expandedExercisesView, setExpandedExercisesView] = useState(false);

  const getMethodsLimitsString = (method: Method): string => {
    let methodString = 'Method limits:';

    method.attributes.forEach((a) =>
      a.options?.forEach(
        (o) => (methodString += ` ${o.field} ${o.min ?? ''}-${o.max ?? ''},`)
      )
    );

    return methodString === 'Method limits:' ? '' : methodString.slice(0, -1);
  };

  if (!training) return null;

  return (
    <Box
      sx={{
        mb: 0,
        pt: trainingComponent.id === WARMUP_ID ? 0 : undefined,
        pb: trainingComponent.id === COOLDOWN_ID ? 0 : undefined,
        px: 0,
      }}
    >
      <Box
        sx={{
          py: component?.id !== trainingComponent.id ? 1.75 : 0,
          pt: component?.id === trainingComponent.id ? 1.75 : undefined,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          position="relative"
          mb={component?.id === trainingComponent.id ? 1 : 0}
        >
          <TrainingComponentMenu
            trainingComponent={trainingComponent}
            heatmapView={heatmapView}
            setHeatmapView={setHeatmapView}
          />
          <Stack
            direction={
              screenSize.isSmallerThanLaptop ||
              (screenSize.isLandscapeMobile && trainingComponent === component)
                ? 'column'
                : 'row'
            }
            width="100%"
            justifyContent="space-between"
          >
            <Box
              display="flex"
              p={0}
              justifyContent="space-between"
              alignItems={
                !screenSize.isSmallerThanLaptop ? 'center' : undefined
              }
              flexDirection={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
              width="100%"
            >
              <TrainingComponentCard
                trainingComponent={trainingComponent}
                setOpenAddExerciseModal={setOpenAddExerciseModal}
                setOpenCalendarModal={setOpenAddExerciseModal}
                expandedExercisesView={expandedExercisesView}
                setExpandedExercisesView={setExpandedExercisesView}
              />
              <Box
                display="flex"
                width={screenSize.isMobile ? '100%' : undefined}
                p={0}
                alignItems={!screenSize.isMobile ? 'center' : undefined}
                flexDirection={screenSize.isMobile ? 'column' : 'row'}
              >
                {screenSize.isSmallerThanLaptop &&
                  trainingComponent &&
                  component &&
                  trainingComponent.id === component.id && (
                    <TrainingComponentHeaderMenu />
                  )}
              </Box>
            </Box>
          </Stack>
        </Box>

        {trainingComponent.id === component?.id && (
          <Divider sx={{ p: 0, m: 0, mt: 1.8 }} />
        )}

        <Collapse
          in={component && trainingComponent.id === component.id}
          timeout="auto"
          unmountOnExit
        >
          <Box
            p={2}
            pt={0}
            px={0}
            mt={
              screenSize.isSmallerThanLaptop
                ? 0
                : component?.method !== undefined &&
                    getMethodsLimitsString(component.method).length > 0
                  ? 0
                  : 2
            }
            key={filter}
          >
            {heatmapView ? (
              <MuscleHeatmapView />
            ) : (
              <>
                {component?.method !== undefined && (
                  <Box
                    width="100%"
                    display="flex"
                    justifyContent={
                      screenSize.isSmallerThanLaptop ? 'center' : 'flex-end'
                    }
                    sx={{
                      py: 0.05,
                    }}
                  >
                    <Typography fontSize={10}>
                      {getMethodsLimitsString(component.method)}
                    </Typography>
                  </Box>
                )}

                <Supersets
                  openAddExerciseModal={openAddExerciseModal}
                  setOpenAddExerciseModal={setOpenAddExerciseModal}
                  expandedExercisesView={expandedExercisesView}
                  setExpandedExercisesView={setExpandedExercisesView}
                />
              </>
            )}
          </Box>
        </Collapse>
        {/* )} */}
      </Box>

      <Divider
        sx={{
          width: '100%',
          color: 'white',
          p: 0,
          m: 0,
        }}
      />

      {/* Training Component Calendar Modal */}
      <MyModal
        isOpen={openCalendarModal}
        setIsOpen={(open) => setOpenCalendarModal(open)}
        cancelText="Close"
        onCancel={() => {
          setOpenCalendarModal(false);
        }}
        dialogueContentSx={{
          minWidth: screenSize.isTablet
            ? 500
            : screenSize.isSmallerThanLaptop
              ? 300
              : 1000,
        }}
        componentCalendarView
      >
        <ComponentActionsModal
          trainingComponent={trainingComponent}
          day={day}
        />
      </MyModal>
    </Box>
  );
}
