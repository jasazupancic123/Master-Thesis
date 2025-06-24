import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Stack, Collapse, Divider } from '@mui/material';
import { useState } from 'react';
import { TrainingComponentProps } from '../trainer-day-view/props';
import Supersets from '../supersets/supersets';
import MyModal from '../modal/modal';
import { useRouter } from 'next/navigation';
import MuscleHeatmapView from '../muscle-heatmap-view/muscle-heatmap-view';
import toast from 'react-hot-toast';
import ComponentPeriodization from '../component-periodization/component-periodization';
import { handleCopyComponentApiRequest } from './state';
import TrainingComponentCard from '../training-component-card/training-component-card';
import TrainingComponentMenu from '../training-component-menu/training-component-menu';
import { TrainingInfo } from '@/controller/training/type/training-info.type';
import ComponentActionsModal from '../component-actions-modal/component-actions-modal';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import TrainingComponentExpanded from '../training-component-expanded/training-component-expanded';

export default function TrainingComponentLayout(props: TrainingComponentProps) {
  const screenSize = useScreenSize();
  const router = useRouter();

  const { training, trainingComponent, day } = props;

  const {
    token,
    filter,
    setTrainings,
    components: allComponents,
    exercises: allExercises,
    methods: allMethods,
  } = useGroup();

  const {
    training: selectedTraining,
    component,
    setTodaysTrainings,
  } = useTrainerDayViewContext();

  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [openCalendarModal, setOpenCalendarModal] = useState(false);
  const [openPeriodizationModal, setOpenPeriodizationModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [heatmapView, setHeatmapView] = useState(false);
  const [openOverwriteModal, setOpenOverwriteModal] = useState(false);
  const [trainingInPeriodForModal, setTrainingInPeriodForModal] =
    useState<TrainingInfo | null>(null);

  return (
    <Box mb={0} py={0.25} px={0}>
      <Box sx={{ bgcolor: 'background.paper', my: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          pt={trainingComponent.id === WARMUP_ID ? 1 : undefined}
          pb={trainingComponent.id === COOLDOWN_ID ? 1 : undefined}
          position="relative"
          py={
            component?.id === trainingComponent.id &&
            training.id === selectedTraining?.id
              ? 1
              : 0
          }
          mb={
            component?.id === trainingComponent.id &&
            training.id === selectedTraining?.id
              ? 1
              : 0
          }
        >
          <TrainingComponentMenu
            trainingComponent={trainingComponent}
            heatmapView={heatmapView}
            setHeatmapView={setHeatmapView}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            training={training}
            setOpenPeriodizationModal={setOpenPeriodizationModal}
            setOpenCalendarModal={setOpenCalendarModal}
          />
          <Stack
            direction={
              screenSize.isMobile ||
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
              alignItems={!screenSize.isMobile ? 'center' : undefined}
              flexDirection={screenSize.isMobile ? 'column' : 'row'}
              width="100%"
            >
              <TrainingComponentCard
                trainingComponent={trainingComponent}
                training={training}
                setOpenAddExerciseModal={setOpenAddExerciseModal}
                setOpenCalendarModal={setOpenAddExerciseModal}
              />
              <Box
                display="flex"
                width={screenSize.isMobile ? '100%' : undefined}
                p={0}
                mr={1}
                alignItems={!screenSize.isMobile ? 'center' : undefined}
                flexDirection={screenSize.isMobile ? 'column' : 'row'}
              >
                {screenSize.isMobile &&
                  trainingComponent &&
                  component &&
                  selectedTraining?.id === training.id &&
                  trainingComponent.id === component.id && (
                    <TrainingComponentExpanded training={training} />
                  )}
              </Box>
            </Box>
          </Stack>
        </Box>

        <Collapse
          in={
            component &&
            trainingComponent.id === component.id &&
            training.id === selectedTraining?.id
          }
          timeout="auto"
          unmountOnExit
        >
          <Box
            bgcolor="background.paper"
            p={2}
            pt={0}
            px={
              screenSize.isMobile || screenSize.isLandscapeMobile
                ? 0
                : undefined
            }
            key={filter}
          >
            {heatmapView ? (
              <MuscleHeatmapView setHeatmapView={setHeatmapView} />
            ) : (
              <Supersets
                openAddExerciseModal={openAddExerciseModal}
                setOpenAddExerciseModal={setOpenAddExerciseModal}
              />
            )}
          </Box>
        </Collapse>
        {/* )} */}
      </Box>

      {trainingComponent.id !== COOLDOWN_ID && (
        <Divider
          sx={{
            width: '100%',
            color: 'white',
            p: 0,
            m: 0,
          }}
        />
      )}

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
          training={training}
          setOpenOverwriteModal={setOpenOverwriteModal}
          setTrainingInPeriodForModal={setTrainingInPeriodForModal}
          day={day}
        />
      </MyModal>

      {/* Overwrite Modal */}
      <MyModal
        isOpen={openOverwriteModal}
        setIsOpen={(open) => setOpenOverwriteModal(open)}
        cancelText="Close"
        onCancel={() => {
          setTrainingInPeriodForModal(null);
          setOpenOverwriteModal(false);
        }}
        onConfirm={async () => {
          if (!trainingInPeriodForModal) {
            toast.error('No training found for the selected date');
            return;
          }
          handleCopyComponentApiRequest(
            {
              training,
              trainingInPeriod: trainingInPeriodForModal,
              component: trainingComponent,
              override: true,
            },
            {
              token,
              router,
              allComponents,
              allExercises,
              allMethods,
              setTrainings,
              setTodaysTrainings,
              day,
            }
          );
          setTrainingInPeriodForModal(null);
          setOpenOverwriteModal(false);
        }}
      >
        Overwrite existing component?
      </MyModal>
    </Box>
  );
}
