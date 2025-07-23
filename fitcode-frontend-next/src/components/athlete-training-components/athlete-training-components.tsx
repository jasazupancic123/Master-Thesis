import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Box, Collapse, IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material';
import { SetState } from '@/common/type/state.type';
import { Training } from '@/controller/training/type/training.type';
import { CommonService } from '@/common/service/common.service';
import AthleteSuperset from '../athlete-superset/athlete-superset';
import MyModal from '../modal/modal';
import toast from 'react-hot-toast';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { ExerciseTrainingView } from '@/common/type/exercise-or-training.type';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { useTraining } from '@/store/training-provider';
import { useRouter } from 'next/navigation';

const commonService = CommonService.instance;

interface AthleteTrainingComponentsProps {
  training: Training;
  components: TrainingComponent[];
  selectedComponent: TrainingComponent | null;
  setSelectedComponent: SetState<TrainingComponent | null>;
  showSupersets: boolean;
  setShowSupersets: SetState<boolean>;
  modal: boolean;
  setModal: SetState<boolean>;
  timeout: number;
}

export default function AthleteTrainingComponents(
  props: AthleteTrainingComponentsProps
) {
  const {
    training,
    components,
    selectedComponent,
    setSelectedComponent,
    showSupersets,
    setShowSupersets,
    modal,
    setModal,
    timeout,
  } = props;

  const { trainingInProgress, setTrainingInProgress, setView } = useTraining();

  const theme = useTheme();
  const router = useRouter();

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={4}
        sx={{
          overflow: 'auto',
        }}
      >
        {components.map((component) => {
          const IconComponent = commonService.navigation.getComponentIcon(
            component.id
          );

          return (
            <Box key={component.id}>
              <IconButton
                sx={{ m: 0 }}
                onClick={() => {
                  setShowSupersets(true);
                  setSelectedComponent(component);
                }}
              >
                <IconComponent
                  sx={{
                    fontSize: 26,
                    cursor: 'pointer',
                    color:
                      selectedComponent?.id === component.id
                        ? theme.palette.primary.main
                        : undefined,
                  }}
                />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      <Collapse in={showSupersets} timeout={timeout}>
        <Box width="100%" display="flex" flexDirection="column" gap={2}>
          {!selectedComponent?.supersets.length ? (
            <Typography textAlign="center" sx={{ fontSize: 12 }}>
              No supersets available
            </Typography>
          ) : (
            selectedComponent.supersets.map((superset, i) => (
              <AthleteSuperset
                superset={superset}
                supersetIndex={i}
                key={`superset-${i}`}
              />
            ))
          )}
        </Box>
      </Collapse>
      <MyModal
        isOpen={modal}
        setIsOpen={(open) => setModal(open)}
        cancelText="Cancel"
        onCancel={() => setModal(false)}
        onConfirm={() => {
          if (!selectedComponent) {
            toast.error('No component selected.');
            return;
          }

          handleApiRequest(
            router,
            () =>
              TrainingController.findByIdAndPopulateAthleteWorkloads(
                training.id,
                selectedComponent.id
              ),
            (training) => {
              setTrainingInProgress(
                (prev) =>
                  ({
                    ...prev,
                    training: training,
                    selectedComponent: selectedComponent,
                  }) as AthleteTrainingInProgress
              );
              setView(ExerciseTrainingView.TrainingView);
              setModal(false);
            },
            undefined,
            'Failed to start training'
          );
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Start <b>{selectedComponent?.component?.name || 'training'}</b>?
        </Typography>
      </MyModal>
    </Box>
  );
}
