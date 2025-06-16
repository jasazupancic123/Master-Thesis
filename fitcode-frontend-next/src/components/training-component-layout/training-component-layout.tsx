import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { Box, Stack, Collapse } from '@mui/material';
import { useState } from 'react';
import { TrainingComponentProps } from '../trainer-day-view/props';
import Supersets from '../supersets/supersets';
import MyModal from '../modal/modal';
import { useRouter } from 'next/navigation';
import MuscleHeatmapView from '../muscle-heatmap-view/muscle-heatmap-view';
import toast from 'react-hot-toast';
import { Training } from '@/controller/training/type/training.type';
import TrainingComponentCalendar from '../training-component-calendar/training-component-calendar';
import ComponentPeriodization from '../component-periodization/component-periodization';
import { handleCopyComponentApiRequest } from './state';
import TrainingComponentCard from '../training-component-card/training-component-card';
import TrainingComponentMenu from '../training-component-menu/training-component-menu';
import TrainingComponentExpanded from '../training-component-expanded/training-component-expanded';
import { TrainingInfo } from '@/controller/training/type/training-info.type';

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
    <Box my={1} p={0} px={0}>
      <Box sx={{ bgcolor: 'background.paper', my: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          position="relative"
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
            alignItems="center"
            width="100%"
            justifyContent="space-between"
          >
            <Box
              display="flex"
              p={0}
              justifyContent="space-between"
              alignItems="center"
              flexDirection={screenSize.isMobile ? 'column' : 'row'}
              width="100%"
            >
              <TrainingComponentCard
                trainingComponent={trainingComponent}
                training={training}
                setOpenAddExerciseModal={setOpenAddExerciseModal}
              />
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
            </Box>
          </Stack>
        </Box>

        {/* {component &&
            trainingComponent.id === component.id &&
            training.id === selectedTraining?.id && ( */}
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
        <TrainingComponentCalendar
          trainingComponent={trainingComponent}
          training={training}
          setOpenOverwriteModal={setOpenOverwriteModal}
          setTrainingInPeriodForModal={setTrainingInPeriodForModal}
          copyComponent={true}
          day={day}
        />
      </MyModal>

      {/* Periodization Modal */}
      <MyModal
        isOpen={openPeriodizationModal}
        setIsOpen={(open) => setOpenPeriodizationModal(open)}
        cancelText="Close"
        onCancel={() => {
          setOpenPeriodizationModal(false);
        }}
        componentCalendarView
        dialogueContentSx={{
          minWidth: screenSize.isTablet
            ? 500
            : screenSize.isSmallerThanLaptop
              ? 300
              : 1000,
        }}
      >
        <ComponentPeriodization
          selectedComponent={trainingComponent}
          training={training}
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
