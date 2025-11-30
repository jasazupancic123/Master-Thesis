import { Add, Circle } from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import AthleteHeader from '../athlete/athlete-header';
import { handleInitTrainingInProgressComponent } from './actions/actions-training-in-progress';
import { useTrainingInProgressUtils } from './context/training-in.progress-utils.provider';
import { useUndoneExercises } from './context/undone-exercises.provider';
import FinishPauseTrainingModal from './modals/finish-pause-training-modal';
import UndoneSetsErrorModal from './modals/undone-sets-error-modal';
import TrainingInProgressExerciseContainer from './training-in-progress-exercise-container';
import TrainingInProgressExerciseHeaderCard from './training-in-progress-exercise-header-card';
import { preloadPoseLandmarker } from '@/core/exercise-ai-prescriptions/util/pose-landmarker-loader.util';
import { TrackingMethod } from '@/core/training/enum/tracking-method.enum';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import type { TrainingInProgress } from '@/core/training/type/training-in-progress.type';
import { LINK_ATHLETE_HOME } from '@/lib/common/const/nav.const';
import { useAthleteHeader } from '@/store/athlete-header.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { useTrainings } from '@/store/trainings.provider';
import MyModal from '@/ui/modal';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function TrainingInProgress() {
  const theme = useTheme();
  const pathname = usePathname();

  const { user } = useAuthenticatedAuth();
  const { activeTraining, exercises } = useMain();

  const trainingContext = useTrainings();
  const trainingInProgressContext = useTrainingInProgress();
  const trainingInProgressUtilsContext = useTrainingInProgressUtils();
  const athleteHeaderContext = useAthleteHeader();
  const undoneExercisesContext = useUndoneExercises();

  // add exercises modal
  const [searchExercisesText, setSearchExercisesText] = useState('');
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchExercisesText.toLowerCase())
  );

  const { trainingInProgress, clearTrainingState } = trainingContext;

  const { supersetIndex, selectedExercise } = trainingInProgressContext;

  const {
    openCancelTrainingModal,
    setOpenCancelTrainingModal,
    openFinishTrainingModal,
    setOpenFinishTrainingModal,
    openAddExerciseModal,
    setOpenAddExerciseModal,
    showUndoneSetsError,
    setShowUndoneSetsError,
    edit,
  } = trainingInProgressUtilsContext;

  const { selectedTrackingMethod } = athleteHeaderContext;

  const exerciseRefs = useRef(new Map<string, HTMLDivElement>());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastScrollLeft = useRef<number>(0);

  const getExerciseRef = useCallback(
    (id: string): React.RefCallback<HTMLDivElement> =>
      (node) => {
        if (node) exerciseRefs.current.set(id, node);
        else exerciseRefs.current.delete(id);
      },
    []
  );

  useEffect(() => {
    const redirectToTrainings = async () => {
      window.location.href = LINK_ATHLETE_HOME.href;
      await clearTrainingState();
    };

    if (!activeTraining || !activeTraining.statuses?.length) {
      redirectToTrainings();
      return;
    }

    const componentId = pathname.split('/').pop() || '';

    if (activeTraining && activeTraining.statuses && componentId) {
      const status = activeTraining.statuses.find(
        (s) =>
          s.componentId === componentId &&
          (s.status === TrainingStatus.IN_PROGRESS ||
            s.status === TrainingStatus.PAUSED)
      );

      if (!status) {
        redirectToTrainings();
        return;
      }

      const component = activeTraining.components.find(
        (c) => c.id === componentId
      );

      if (!component) {
        redirectToTrainings();
        return;
      }

      const trainingInProgress: TrainingInProgress = {
        userId: user.uid,
        training: activeTraining,
        recordedSets: [],
        startOfTraining: dayjs(),
        supersets: [],
        selectedComponent: component,
      };

      handleInitTrainingInProgressComponent({
        useTraining: { ...trainingContext, trainingInProgress },
        useTrainingInProgressContext: trainingInProgressContext,
      });
    }
  }, [activeTraining]);

  /* Preload pose landmarker */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    preloadPoseLandmarker();
  }, []);

  /* Init training in progress for selected component */
  /* useEffect(() => {
    if (!trainingInProgress) return;

    handleInitTrainingInProgressComponent({
      useTraining: { ...trainingContext, trainingInProgress },
      useTrainingInProgressContext: trainingInProgressContext,
    });
  }, [trainingInProgress?.selectedComponent]); */

  // keep scroll position in case the whole list remounts
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => (lastScrollLeft.current = scroller.scrollLeft);
    scroller.addEventListener('scroll', onScroll);
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const scroller = scrollerRef.current;
    if (!scroller || !selectedExercise?.id) return;

    const el = exerciseRefs.current.get(selectedExercise.id);
    if (!el) {
      // If we don't have the element yet, at least restore previous scroll
      scroller.scrollLeft = lastScrollLeft.current;
      return;
    }

    // Center the selected exercise in the horizontal scroller
    const elCenter = el.offsetLeft + el.offsetWidth / 2;
    const target = elCenter - scroller.clientWidth / 2;

    const next = Math.max(0, target);
    scroller.scrollTo({ left: next, behavior: 'smooth' });
    lastScrollLeft.current = next;
  }, [selectedExercise, trainingInProgress, supersetIndex]);

  if (!trainingInProgress || !trainingInProgress.training) return null;

  return (
    <Box
      id="training-in-progress-main"
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {selectedTrackingMethod !== TrackingMethod.CAMERA && (
        <>
          <AthleteHeader
            trainingInProgressUndoneExercisesContext={undoneExercisesContext}
            trainingInProgressContext={trainingInProgressContext}
            trainingInProgressUtilsContext={trainingInProgressUtilsContext}
          />
          <Box
            component={'div'}
            ref={scrollerRef}
            display="flex"
            gap={1}
            px={1}
            pb={1}
            mt={2}
            maxWidth="100%"
            sx={{
              overflowX: 'auto',
              mx: 'auto',
            }}
          >
            {(trainingInProgress.supersets || []).map((superset, i) => {
              if (!superset.exercises.length) return null;

              const isSelected = supersetIndex === i; // <- key change

              return (
                <Box
                  key={i}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.5}
                >
                  <Typography
                    key={i}
                    fontSize={14}
                    fontWeight={isSelected ? 600 : undefined}
                    textAlign="center"
                    lineHeight={1}
                    noWrap
                    sx={{
                      flex: '0 0 auto',
                      textTransform: isSelected ? 'uppercase' : undefined,
                      color: isSelected
                        ? theme.palette.primary.main
                        : undefined,
                    }}
                  >
                    {isSelected && (
                      <Circle
                        sx={{
                          fontSize: 8,
                          verticalAlign: 'middle',
                          mr: 0.5,
                          mb: 0.2,
                        }}
                      />
                    )}
                    Block {i + 1}
                  </Typography>

                  <Box
                    sx={{
                      width: '95%',
                      height: '1px',
                      backgroundColor: isSelected
                        ? theme.palette.primary.main
                        : 'transparent',
                    }}
                  />

                  <Box display="flex" justifyContent="center" gap={0.5}>
                    {superset.exercises.map((e) => (
                      <TrainingInProgressExerciseHeaderCard
                        key={`${e.id}-${supersetIndex}`}
                        exercise={e}
                        superset={superset}
                        supersetIndex={i}
                        getExerciseRef={getExerciseRef}
                      />
                    ))}

                    {/* Button to add new exercise */}
                    {edit && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setOpenAddExerciseModal(true);
                        }}
                        sx={{
                          p: 0.5,
                          border: `1px solid ${theme.palette.primary.main}`,
                          alignSelf: 'center',
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {trainingInProgress &&
      trainingInProgress.supersets &&
      trainingInProgress.supersets.length ? (
        <TrainingInProgressExerciseContainer />
      ) : (
        <Box
          display="flex"
          width="100vw"
          height="100vh"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6">No exercises</Typography>
        </Box>
      )}
      <FinishPauseTrainingModal
        open={openCancelTrainingModal}
        setOpen={setOpenCancelTrainingModal}
        finish={false}
      />

      <FinishPauseTrainingModal
        open={openFinishTrainingModal}
        setOpen={setOpenFinishTrainingModal}
        finish={true}
      />

      <UndoneSetsErrorModal
        open={showUndoneSetsError}
        setOpen={setShowUndoneSetsError}
      />

      <MyModal
        isOpen={openAddExerciseModal}
        setIsOpen={setOpenAddExerciseModal}
      >
        {/* Dropdown of all exercises with search */}
        <Menu
          open={openAddExerciseModal}
          onClose={() => {
            setOpenAddExerciseModal(false);
          }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: 24 }}
        >
          {exercises.length === 0 ? (
            <Typography sx={{ px: 1 }}>No exercises found</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              <SearchBar
                placeholder="Search Exercises"
                value={searchExercisesText}
                handleSearchChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchExercisesText(e.target.value);
                }}
                maxWidth="100%"
              />
              {/* Athlete list */}
              <Box
                display="flex"
                flexDirection="column"
                maxHeight={300}
                sx={{ overflowY: 'auto' }}
              >
                {filteredExercises
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((exercise) => (
                    <MenuItem
                      key={exercise.id}
                      onClick={async () => {
                        await trainingInProgressContext.addExerciseToSuperset(
                          exercise
                        );

                        setOpenAddExerciseModal(false);
                      }}
                    >
                      <Box
                        key={exercise.id}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                        }}
                      >
                        <Typography>{exercise.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Box>
            </Box>
          )}
        </Menu>
      </MyModal>
    </Box>
  );
}
