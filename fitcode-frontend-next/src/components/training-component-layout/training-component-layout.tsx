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
import { handleCopyComponentApiRequest } from './state';
import TrainingComponentCard from '../training-component-card/training-component-card';
import TrainingComponentMenu from '../training-component-menu/training-component-menu';
import { TrainingInfo } from '@/controller/training/type/training-info.type';
import ComponentActionsModal from '../component-actions-modal/component-actions-modal';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import TrainingComponentHeaderMenu from '../training-component-header-menu/training-component-header-menu';
import { useTheme } from '@mui/material';

export default function TrainingComponentLayout(props: TrainingComponentProps) {
  const screenSize = useScreenSize();
  const router = useRouter();
  const theme = useTheme();

  const { training, trainingComponent, day } = props;

  const {
    token,
    filter,
    setTrainings,
    components: allComponents,
    exercises: allExercises,
    methods: allMethods,
  } = useGroup();

  const { training: selectedTraining, component } = useTrainerDayViewContext();

  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [openCalendarModal, setOpenCalendarModal] = useState(false);
  const [openPeriodizationModal, setOpenPeriodizationModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [heatmapView, setHeatmapView] = useState(false);
  const [openOverwriteModal, setOpenOverwriteModal] = useState(false);
  const [trainingInPeriodForModal, setTrainingInPeriodForModal] =
    useState<TrainingInfo | null>(null);
  const [expandedExercisesView, setExpandedExercisesView] = useState(false);

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
                training={training}
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
                  selectedTraining?.id === training.id &&
                  trainingComponent.id === component.id && (
                    <TrainingComponentHeaderMenu training={training} />
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
            p={2}
            pt={0}
            px={0}
            mt={screenSize.isSmallerThanLaptop ? 0 : 2}
            key={filter}
          >
            {heatmapView ? (
              <MuscleHeatmapView setHeatmapView={setHeatmapView} />
            ) : (
              <Supersets
                openAddExerciseModal={openAddExerciseModal}
                setOpenAddExerciseModal={setOpenAddExerciseModal}
                expandedExercisesView={expandedExercisesView}
                setExpandedExercisesView={setExpandedExercisesView}
              />
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
