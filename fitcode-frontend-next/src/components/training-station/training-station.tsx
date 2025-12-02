'use client';

import { useCoachTrainingStation } from '@/store/coach-training-station.provider';
import TrainingStationInit from './training-station-init';
import { alpha, Avatar, Box, Button, Grid2, Typography } from '@mui/material';
import TrainingStationMembers from './training-station-members';
import TrainingStationExercises from './training-station-exercises';
import Image from 'next/image';
import {
  EXERCISE_DEFAULT_IMG_URL,
  USER_AVATAR_IMG_URL,
} from '@/lib/common/const/image.const';
import { lib } from '@/lib';
import { theme } from '@/app/style';
import TrainingExerciseSetBox from '@/ui/training-exercise-set-box';
import TrainingStationExerciseSet from './training-station-exercise-set';
import { getSupersetIndex } from './actions/actions-superset-index';
import { core } from '@/core/core.service';
import { useRouter } from 'next/navigation';
import { Workload } from '@/core/training/type/workload.type';
import TrainingStationHeader from './training-station-header';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { useState } from 'react';
import NewStationModal from './modals/new-station.modal';
import { useMain } from '@/store/main.provider';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import MobileMovementValidation from '../mobile-movement-validation/mobile-movement-validation';
import { useCoachTraining } from '@/store/coach-training.provider';
import toast from 'react-hot-toast';
import { createEmptyPartialWorkload } from './actions/actions-workload';

export default function TrainingStation() {
  const router = useRouter();

  const { exerciseAiPrescriptions } = useMain();

  const { training } = useCoachTraining();

  const {
    station,
    individualTrainings,
    component,
    selectedUser,
    selectedExercise,
    setSelectedExercise,
    selectedSetIndex,
    workloads,
    setWorkloads,
    setSelectedSetIndex,
    handleUpsertSet,
  } = useCoachTrainingStation();

  const [view, setView] = useState<TrackingMethod>(TrackingMethod.MANUAL);
  const [openNewStationModal, setOpenNewStationModal] = useState(false);

  const selectedImageWidth =
    typeof window !== 'undefined'
      ? Math.min(window.innerWidth * 0.9, 340)
      : 340;

  const individualTraining = individualTrainings.find(
    (it) => it.userId === selectedUser?.uid
  );

  const individualExercise = individualTraining?.components
    .find((c) => c.id === component?.id)
    ?.supersets.flatMap((s) => s.exercises)
    .find((e) => e.id === selectedExercise?.id);

  const supersetIndex = individualTraining
    ? getSupersetIndex(individualTraining, component!.id, selectedExercise!.id)
    : null;

  const foundWorkload = workloads.find(
    (w) =>
      w.userId === selectedUser?.uid &&
      w.exerciseId === selectedExercise?.id &&
      w.setNumber === (selectedSetIndex || 0) + 1 &&
      w.componentId === component?.id &&
      w.trainingId === individualTraining?.id &&
      w.supersetIndex === supersetIndex
  );

  // LOGIC: Workload only has id if returned from BE (means it's completed), on FE we handle "PartialWorkload" without id - means it's uncompleted and not posted yet
  const isSetCompleted = foundWorkload && foundWorkload.id !== undefined;
  const isAiReady = exerciseAiPrescriptions.some((ep) =>
    ep.exerciseIds.includes(selectedExercise?.exercise?.id || 'UNKNOWN')
  );

  if (!station) {
    return <TrainingStationInit />;
  }

  return view === TrackingMethod.CAMERA &&
    selectedUser &&
    individualTraining &&
    component &&
    selectedExercise &&
    supersetIndex !== null &&
    selectedSetIndex !== undefined ? (
    <MobileMovementValidation
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      selectedTrackingMethod={view}
      setSelectedTrackingMethod={setView}
      trainingId={training.id}
      userId={selectedUser.uid}
      componentId={component.id}
      supersetIndex={supersetIndex}
      setIndex={selectedSetIndex}
      stationViewProps={{
        individualTraining,
        router,
        workloads,
        handleUpsertSetFromStationView: handleUpsertSet,
      }}
    />
  ) : (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      pb={2}
      sx={{
        mx: 'auto',
      }}
    >
      <TrainingStationHeader />

      <Button
        size="small"
        variant="contained"
        onClick={() => setOpenNewStationModal(true)}
      >
        New station
      </Button>

      <TrainingStationMembers />

      <TrainingStationExercises />

      <Box
        maxWidth={selectedImageWidth}
        sx={{
          position: 'relative',
        }}
      >
        <Image
          src={selectedExercise?.exercise?.imageUrl || EXERCISE_DEFAULT_IMG_URL}
          alt="Exercise Image"
          width={selectedImageWidth}
          height={0}
          unoptimized={lib.common.env.unoptimizeImages()}
          layout="intrinsic"
          style={{
            filter: 'grayscale(100%)',
            borderRadius: 6,
          }}
        />
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          sx={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            p: 1,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Typography
            fontSize={18}
            fontWeight={600}
            sx={{
              textShadow: '0 0 5px rgba(0,0,0,0.8)',
              color: theme.palette.primary.main,
              textTransform: 'uppercase',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              display: '-webkit-box',
            }}
            textAlign="center"
          >
            {selectedExercise?.exercise?.name || 'Unknown Exercise'}
          </Typography>
        </Box>
      </Box>

      <Grid2 container spacing={2} sx={{ width: '100%' }}>
        <Grid2
          size={3}
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
        >
          <Box
            sx={{
              border: `3px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
            }}
          >
            <Avatar
              key={selectedUser?.uid}
              src={selectedUser?.photoURL || USER_AVATAR_IMG_URL}
              sx={{
                width: 80,
                height: 80,
                cursor: 'pointer',
                filter: 'grayscale(100%)',
              }}
            />
          </Box>
        </Grid2>
        <Grid2
          size={6}
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Box
            width="100%"
            display="flex"
            flexWrap="wrap"
            justifyContent="center"
          >
            {selectedExercise &&
              individualExercise?.sets.map((_, setIndex) => {
                const isSetDone =
                  workloads.find((w) => {
                    return (
                      w.userId === selectedUser?.uid &&
                      w.exerciseId === selectedExercise.id &&
                      w.setNumber === setIndex + 1 &&
                      w.componentId === component?.id &&
                      w.trainingId === individualTraining?.id &&
                      w.supersetIndex ===
                        getSupersetIndex(
                          individualTraining,
                          component!.id,
                          selectedExercise!.id
                        )
                    );
                  })?.id !== undefined || false;

                return (
                  <TrainingExerciseSetBox
                    key={setIndex}
                    selectedExercise={selectedExercise}
                    setSetIndex={setSelectedSetIndex}
                    setIndex={setIndex}
                    isSetSelected={selectedSetIndex === setIndex}
                    isSetDone={isSetDone}
                  />
                );
              })}
          </Box>

          {individualExercise ? (
            <TrainingStationExerciseSet exercise={individualExercise} />
          ) : (
            <Typography textAlign="center">
              Exercise not found for selected user
            </Typography>
          )}
        </Grid2>
        <Grid2
          size={3}
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
        >
          {individualExercise && (
            <Box
              width={80}
              height={80}
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{
                borderRadius: '50%',
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box
                width={70}
                height={70}
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                  borderRadius: '50%',
                  mx: 'auto',
                  backgroundColor: isSetCompleted
                    ? theme.palette.primary.main
                    : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  if (isSetCompleted) {
                    setWorkloads((prev) =>
                      prev.filter((w) => w.id !== foundWorkload?.id)
                    );
                    return;
                  }

                  if (
                    !selectedExercise ||
                    !selectedUser ||
                    !individualTraining ||
                    !component ||
                    selectedSetIndex === undefined
                  )
                    return;

                  const workload = createEmptyPartialWorkload({
                    individualTraining,
                    workloads,
                    userId: selectedUser.uid,
                    componentId: component.id,
                    exerciseId: selectedExercise.id,
                    setIndex: selectedSetIndex,
                  });

                  if (!workload) return;

                  await handleUpsertSet(
                    workload,
                    {
                      exerciseId: selectedExercise.id,
                      supersetIndex: workload.supersetIndex,
                      setIndex: selectedSetIndex,
                    },
                    router
                  );
                }}
              >
                <Typography
                  fontSize={12}
                  fontWeight={700}
                  textAlign="center"
                  sx={{
                    color: isSetCompleted
                      ? theme.palette.text.secondary
                      : theme.palette.text.primary,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {isSetCompleted ? 'Done' : 'Confirm'}
                </Typography>
              </Box>
            </Box>
          )}
        </Grid2>
      </Grid2>

      <Box
        width={60}
        height={60}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: isAiReady
            ? theme.palette.primary.main
            : theme.palette.grey[700],
          borderRadius: '25%',
        }}
        onClick={() => {
          if (!isAiReady) return;

          if (isSetCompleted) {
            toast.error('Current set is already completed.');
            return;
          }

          setView(TrackingMethod.CAMERA);
        }}
      >
        <Box
          width={60 / 3}
          height={60 / 3}
          sx={{
            backgroundColor: theme.palette.background.default,
            borderRadius: '50%',
          }}
        />
      </Box>

      <NewStationModal
        open={openNewStationModal}
        setOpen={setOpenNewStationModal}
      />
    </Box>
  );
}
