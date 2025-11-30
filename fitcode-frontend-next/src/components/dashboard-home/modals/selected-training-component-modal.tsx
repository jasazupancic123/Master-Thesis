import { Box, Button, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

import { startTrainingComponent } from '@/components/athlete/actions/actions-training-component';
import { core } from '@/core/core.service';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';
import MyModal from '@/ui/modal';

interface Props {
  training: Training;
  setTraining: SetState<Training | null>;
  component: TrainingComponent;
  setComponent: SetState<TrainingComponent | null>;
  hasPlayedAudioRef: React.RefObject<boolean>;
}

export default function SelectedTrainingComponentModal(
  props: ModalProps & Props
) {
  const router = useRouter();

  const { user } = useAuthenticatedAuth();

  const mainContext = useMain();
  const trainingsContext = useTrainings();

  const {
    open,
    setOpen,
    training,
    setTraining,
    component,
    setComponent,
    hasPlayedAudioRef,
  } = props;

  const hasGotWarmup = component.supersets.some((superset) => superset.warmup)
    ? 1
    : 0;

  const group = mainContext.groups.find((g) => g.id === training.groupId);

  const IconComponent = lib.common.component.getIcon(component.id);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={setOpen}
      cancelText="Close"
      onCancel={() => {
        setOpen(false);
        setTraining(null);
        setComponent(null);
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        sx={{ mx: 'auto', p: 1 }}
        maxWidth={300}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={0.5}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
          >
            {IconComponent && <IconComponent />}
            <Typography textAlign="center" variant="h5">
              {component.id[0].toUpperCase() + component.id.slice(1)}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
          >
            <Typography textAlign="center">
              {group?.name || 'Unknown Group'}
            </Typography>
            <Typography textAlign="center">
              {dayjs(component.from).format('DD MMM, HH:mm')}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={async () => {
            await startTrainingComponent(
              {
                useMain: mainContext,
                useTrainings: trainingsContext,
              },
              {
                user,
                training,
                selectedComponent: component,
                setOpen,
                hasPlayedAudioRef,
                router,
              }
            );
          }}
        >
          Start
        </Button>
        <Box width="100%" display="flex" flexDirection="column" gap={2}>
          {!component.supersets.length ? (
            <Typography textAlign="center">No supersets available</Typography>
          ) : (
            core.training
              .getAthleteSupersets(user.uid, component)
              .map((superset, i) => (
                <Box
                  key={i}
                  display="flex"
                  flexDirection="column"
                  gap={1}
                  sx={{
                    background: LINEAR_GRADIENT_BG,
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <Typography variant="h6">
                    {superset.warmup
                      ? 'Warmup'
                      : superset.cooldown
                        ? 'Cooldown'
                        : `Block ${hasGotWarmup ? -1 : 0 + i + 1}`}
                  </Typography>

                  {superset.exercises.map((exercise) => (
                    <Box
                      key={exercise.id}
                      width={200}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={2}
                    >
                      <Typography>
                        {exercise.exercise?.name || 'Unknown exercise'}
                      </Typography>

                      <Typography textAlign="center">
                        {exercise.sets.length} sets
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))
          )}
        </Box>
      </Box>
    </MyModal>
  );
}
