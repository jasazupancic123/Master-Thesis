import { handleApiRequest, SetState } from '@/common/type/state.type';
import { useAuth } from '@/store/auth-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTraining } from '@/store/training-provider';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { TrainingController } from '@/controller/training/training.controller';
import {
  ExerciseSet,
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import {
  Training,
  TrainingStatus,
} from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import {
  Box,
  Fab,
  FormControl,
  Grid2,
  Select,
  Typography,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Animation from '../animation/animation';
import MyModal from '../modal/modal';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { ExerciseParam } from '../exercise-param/exercise-param';
import { TrainingService } from '@/controller/training/training.service';
import { AthleteTrainingInProgress } from '@/controller/training/type/training-in-progress.type';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import LeftRightExerciseText from '../left-right-exercise-text/left-right-exercise-text';

interface TrainingInProgressProps {
  profile: User;
  token: string;
  setView: (view: 'exercises' | 'training') => void;
  setTrainings: SetState<Training[]>;
  setAllTrainings: SetState<Training[]>;
}

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const {
    clearTrainingState,
    trainingInProgress,
    setTrainingInProgress,
    setView,
  } = useTraining();

  const { profile, token, setTrainings, setAllTrainings } = props;

  const [selectedSuperset, setSelectedSuperset] = useState<
    Superset | undefined
  >();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(true);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (!trainingInProgress) return;

    const newTrainingInProgress = { ...trainingInProgress };
    if (!newTrainingInProgress.supersets) {
      let usersSupersets = undefined;
      for (const subgroup of newTrainingInProgress.selectedComponent
        .subgroups) {
        if (subgroup.membersIds.includes(profile.uid)) {
          usersSupersets = subgroup.supersets;
          break;
        }
      }
      if (!usersSupersets)
        usersSupersets = newTrainingInProgress.selectedComponent.supersets; //default group

      newTrainingInProgress.supersets = usersSupersets;
    }

    if (!newTrainingInProgress.startOfTraining) {
      newTrainingInProgress.startOfTraining = dayjs();
    }

    if (!newTrainingInProgress.supersetIndex) {
      newTrainingInProgress.supersetIndex = 0;
      setSelectedSuperset(newTrainingInProgress.supersets[0]);
    } else
      setSelectedSuperset(
        newTrainingInProgress.supersets[
          newTrainingInProgress.supersetIndex || 0
        ]
      );

    setTrainingInProgress(
      (prev) =>
        ({
          ...prev,
          supersets: newTrainingInProgress.supersets,
          startOfTraining: newTrainingInProgress.startOfTraining,
          supersetIndex: newTrainingInProgress.supersetIndex,
        }) as AthleteTrainingInProgress
    );
  }, [trainingInProgress?.selectedComponent]);

  useEffect(() => {
    if (!trainingInProgress) return;
    if (!trainingInProgress.startOfTraining) {
      setTrainingInProgress(
        (prev) =>
          ({
            ...prev,
            startOfTraining: dayjs(),
          }) as AthleteTrainingInProgress
      );
    }

    const startTime = dayjs(trainingInProgress.startOfTraining).valueOf();
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [trainingInProgress?.startOfTraining]);

  const handleFinishTraining = async () => {
    if (!trainingInProgress || !user || !trainingInProgress.selectedComponent)
      return toast.error('An error occurred');

    handleApiRequest(
      router,
      () =>
        TrainingController.finishComponent(
          token,
          trainingInProgress.training.id,
          user.uid,
          trainingInProgress.selectedComponent.id,
          trainingInProgress.selectedComponent.component?.id ||
            trainingInProgress.selectedComponent.id,
          trainingInProgress.supersets
        ),
      (training) => {
        toast.success('Training data updated successfully');
        clearTrainingState();
        setView('exercises');
        setSelectedSuperset(undefined);
        if (trainingInProgress.training.id === training.id) {
          setTrainingInProgress(
            (prev) =>
              ({
                ...prev,
                training: training,
              }) as AthleteTrainingInProgress
          );
        }
        setTrainings((prev) =>
          prev.map((t) => {
            if (t.id === training.id) {
              return training; // Update the training data
            }
            return t;
          })
        );
        setAllTrainings((prev) =>
          prev.map((t) => {
            if (t.id === training.id) {
              return training; // Update the training data
            }
            return t;
          })
        );
      },
      undefined,
      'Failed to update training data'
    );
  };

  const handleCancelTraining = () => {
    clearTrainingState();
    setView('exercises');
    setElapsedTime(0);
    setSelectedSuperset(undefined);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00:00'; // Default to zero time if invalid
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleContinue = () => {
    if (!trainingInProgress?.supersets || !selectedSuperset) return;
    handleCloseMenu();
    if (
      trainingInProgress?.supersets.indexOf(selectedSuperset) ===
      trainingInProgress?.supersets.length - 1
    ) {
      setOpenFinishTrainingModal(true);
    } else {
      setOpenNextSupersetModal(true);
    }
  };

  const handleCancel = () => {
    handleCloseMenu();
    setOpenCancelTrainingModal(true);
  };

  return playAnimation ? (
    <Animation
      text="LOADING YOUR TRAINING"
      onEnd={() => {
        setPlayAnimation(false);
        setView('training');
      }}
      fullScreen={true}
    />
  ) : (
    <>
      {trainingInProgress &&
      trainingInProgress.supersets &&
      selectedSuperset ? (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            sx={{ backgroundColor: 'background.paper' }}
            py={2}
            px={1.5}
          >
            <Typography
              variant="body1"
              fontSize={screenSize.isUltraSmall ? 13 : undefined}
            >
              Superset{' '}
              {trainingInProgress.supersets.indexOf(selectedSuperset) + 1}
            </Typography>
            <Typography
              color={theme.palette.primary.main}
              variant="h6"
              sx={{
                textAlign: 'center',
                marginX: 'auto',
                textTransform: 'uppercase',
              }}
            >
              {trainingInProgress.selectedComponent.id}
            </Typography>
            <Typography
              variant="body1"
              fontSize={screenSize.isUltraSmall ? 13 : undefined}
            >
              {formatTime(elapsedTime)}
            </Typography>
          </Box>
          <Box
            ref={boxRef}
            pt={1.5}
            width="100%"
            flexGrow={1} // Ensures it expands
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              overflowY: 'auto', // Allow full scroll
              height: 'calc(100vh - 150px)', // Adjust as needed
              minHeight: 0, // Ensures it doesn't restrict child elements
            }}
          >
            {selectedSuperset.exercises.map((exercise, i) => {
              let isBilateral = false;
              exercise.sets.forEach((set) => {
                set.paramValuesL.forEach((param, j) => {
                  if (param.value !== set.paramValuesR[j].value) {
                    isBilateral = true;
                  }
                });
              });

              return (
                <Box
                  key={`${exercise.id}${i}`}
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  sx={{ position: 'relative' }}
                >
                  <IconButton
                    sx={{
                      p: 0,
                      m: 0,
                      position: 'absolute',
                      top: 0,
                      right: 5,
                      display:
                        exercise.exercise?.name.toLowerCase() !==
                        'deep back squat'
                          ? 'none'
                          : undefined,
                    }}
                  >
                    <CameraAlt />
                  </IconButton>
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}
                  >
                    {exercise.exercise?.name || 'Un-named Exercise'}
                  </Typography>

                  <Box
                    position="absolute"
                    display="flex"
                    flexDirection="column"
                    top={0}
                    left={10}
                    zIndex={1000}
                    pb={
                      screenSize.isMobile || screenSize.isLandscapeMobile
                        ? 35
                        : undefined
                    }
                  >
                    <Typography variant="body2" color="rgb(177, 183, 189)">
                      {`${trainingInProgress.supersets.indexOf(selectedSuperset) + 1}${String.fromCharCode(65 + i)}`}
                    </Typography>
                  </Box>
                  <Grid2
                    container
                    size={12}
                    width="100%"
                    mt={1}
                    display="flex"
                    alignItems="center"
                  >
                    <Grid2
                      size={4.5}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      sx={{ mt: 1 }}
                    >
                      <Image
                        src={
                          exercise.exercise?.imageUrl?.trim() ||
                          '/fitcode_logo_transparent_square.png'
                        }
                        alt="Exercise Image"
                        width={
                          !screenSize.isMobile
                            ? exercise.exercise?.imageUrl
                              ? 200
                              : 100
                            : exercise.exercise?.imageUrl &&
                                exercise.exercise?.imageUrl.length > 2
                              ? 170
                              : 100
                        }
                        height={0}
                        style={{
                          maxWidth: !screenSize.isMobile ? '200px' : '170px',
                          height: 'auto', // Maintains aspect ratio dynamically
                          borderRadius: 15,
                        }}
                        onClick={() => {
                          setOpenVideoPlayerModal(true);
                          setVideoUrl(exercise.exercise?.videoUrl || '');
                        }}
                      />
                    </Grid2>
                    <Grid2 size={7.5} px={1}>
                      <Box
                        key={exercise.id}
                        display="flex"
                        flexDirection="column"
                        width="100%"
                        gap={1}
                      >
                        {exercise.sets.map((set, i) => {
                          return (
                            <Box
                              key={`${set.setNumber}${i}`}
                              display="flex"
                              width="100%"
                              justifyContent="center"
                              alignItems="center"
                              gap={1}
                            >
                              {isBilateral && (
                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  gap={1}
                                  justifyContent="end"
                                  height={i === 0 ? 80 : 55}
                                >
                                  <LeftRightExerciseText title="L" />
                                  <LeftRightExerciseText title="R" />
                                </Box>
                              )}

                              {Array.isArray(exercise.params) &&
                                exercise.params.map((param, j) => {
                                  const valueL = set.paramValuesL.find(
                                    (pv) => pv.field === param.field
                                  ) || {
                                    field: param.field,
                                    selected: 'set',
                                    value: (i + 1).toString(),
                                  };
                                  const valueR = set.paramValuesR.find(
                                    (pv) => pv.field === param.field
                                  ) || {
                                    field: param.field,
                                    selected: 'set',
                                    value: (i + 1).toString(),
                                  };

                                  const value = valueL;

                                  return isBilateral ? (
                                    <Box
                                      key={param.field}
                                      flexBasis={
                                        (
                                          100 / exercise.params.length
                                        ).toString() + '%'
                                      }
                                    >
                                      <ExerciseParam
                                        showOptions={i === 0}
                                        disableSets
                                        param={param}
                                        value={valueL}
                                        onOptionChange={(newValue) => {}}
                                        onSubOptionChange={(newValue) => {
                                          if (
                                            +newValue < 0 ||
                                            param.field === 'volWorkSets'
                                          )
                                            return;

                                          const paramIndex =
                                            exercise.sets[0].paramValuesL.findIndex(
                                              (pv) => pv.field === param.field
                                            );

                                          const newExercise = { ...exercise };

                                          const updatedSets: ExerciseSet[] =
                                            newExercise.sets.map((set, j) => {
                                              if (i !== j) return set;
                                              return {
                                                setNumber: set.setNumber,
                                                paramValuesL: [
                                                  ...set.paramValuesL,
                                                ].map((param, index) => {
                                                  if (index === paramIndex) {
                                                    return {
                                                      field: param.field,
                                                      selected: param.selected,
                                                      value: newValue as string,
                                                    } as AttributeValue;
                                                  }
                                                  return {
                                                    field: param.field,
                                                    selected: param.selected,
                                                    value: param.value,
                                                  } as AttributeValue;
                                                }),
                                                paramValuesR: set.paramValuesR,
                                              };
                                            });

                                          newExercise.sets = [...updatedSets];

                                          const newExercises =
                                            selectedSuperset.exercises.map(
                                              (ex) => {
                                                if (ex.id === exercise.id) {
                                                  return newExercise;
                                                }
                                                return ex;
                                              }
                                            );

                                          const newSuperset = {
                                            ...selectedSuperset,
                                            exercises: newExercises,
                                          };

                                          setSelectedSuperset((prev) => {
                                            if (!prev) return undefined;
                                            return newSuperset;
                                          });

                                          const newSupersets =
                                            trainingInProgress.supersets.map(
                                              (superset, j) => {
                                                if (
                                                  j ===
                                                  trainingInProgress.supersetIndex
                                                ) {
                                                  return newSuperset;
                                                }
                                                return superset;
                                              }
                                            );

                                          setTrainingInProgress((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              supersets: newSupersets,
                                            } as AthleteTrainingInProgress;
                                          });
                                        }}
                                      />
                                      <ExerciseParam
                                        showOptions={false}
                                        disableSets
                                        param={param}
                                        value={valueR}
                                        onOptionChange={(newValue) => {}}
                                        onSubOptionChange={(newValue) => {
                                          if (
                                            +newValue < 0 ||
                                            param.field === 'volWorkSets'
                                          )
                                            return;

                                          const paramIndex =
                                            exercise.sets[0].paramValuesL.findIndex(
                                              (pv) => pv.field === param.field
                                            );

                                          const newExercise = { ...exercise };

                                          const updatedSets: ExerciseSet[] =
                                            newExercise.sets.map((set, j) => {
                                              if (i !== j) return set;
                                              return {
                                                setNumber: set.setNumber,
                                                paramValuesL: set.paramValuesL,
                                                paramValuesR: [
                                                  ...set.paramValuesR,
                                                ].map((param, index) => {
                                                  if (index === paramIndex) {
                                                    return {
                                                      field: param.field,
                                                      selected: param.selected,
                                                      value: newValue as string,
                                                    } as AttributeValue;
                                                  }
                                                  return {
                                                    field: param.field,
                                                    selected: param.selected,
                                                    value: param.value,
                                                  } as AttributeValue;
                                                }),
                                              };
                                            });

                                          newExercise.sets = [...updatedSets];

                                          const newExercises =
                                            selectedSuperset.exercises.map(
                                              (ex) => {
                                                if (ex.id === exercise.id) {
                                                  return newExercise;
                                                }
                                                return ex;
                                              }
                                            );

                                          const newSuperset = {
                                            ...selectedSuperset,
                                            exercises: newExercises,
                                          };

                                          setSelectedSuperset((prev) => {
                                            if (!prev) return undefined;
                                            return newSuperset;
                                          });

                                          const newSupersets =
                                            trainingInProgress.supersets.map(
                                              (superset, j) => {
                                                if (
                                                  j ===
                                                  trainingInProgress.supersetIndex
                                                ) {
                                                  return newSuperset;
                                                }
                                                return superset;
                                              }
                                            );

                                          setTrainingInProgress((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              supersets: newSupersets,
                                            } as AthleteTrainingInProgress;
                                          });
                                        }}
                                      />
                                    </Box>
                                  ) : (
                                    <Box
                                      key={param.field}
                                      flexBasis={
                                        (
                                          100 / exercise.params.length
                                        ).toString() + '%'
                                      }
                                    >
                                      <ExerciseParam
                                        showOptions={i === 0}
                                        disableSets
                                        param={param}
                                        value={value!}
                                        onOptionChange={(newValue) => {}}
                                        onSubOptionChange={(newValue) => {
                                          if (
                                            +newValue < 0 ||
                                            param.field === 'volWorkSets'
                                          )
                                            return;

                                          const paramIndex =
                                            exercise.sets[0].paramValuesL.findIndex(
                                              (pv) => pv.field === param.field
                                            );

                                          const newExercise = { ...exercise };

                                          const updatedSets: ExerciseSet[] =
                                            newExercise.sets.map((set, j) => {
                                              if (i !== j) return set;
                                              return {
                                                setNumber: set.setNumber,
                                                paramValuesL: [
                                                  ...set.paramValuesL,
                                                ].map((param, index) => {
                                                  if (index === paramIndex) {
                                                    return {
                                                      field: param.field,
                                                      selected: param.selected,
                                                      value: newValue as string,
                                                    } as AttributeValue;
                                                  }
                                                  return {
                                                    field: param.field,
                                                    selected: param.selected,
                                                    value: param.value,
                                                  } as AttributeValue;
                                                }),
                                                paramValuesR: [
                                                  ...set.paramValuesR,
                                                ].map((param, index) => {
                                                  if (index === paramIndex) {
                                                    return {
                                                      field: param.field,
                                                      selected: param.selected,
                                                      value: newValue as string,
                                                    } as AttributeValue;
                                                  }
                                                  return {
                                                    field: param.field,
                                                    selected: param.selected,
                                                    value: param.value,
                                                  } as AttributeValue;
                                                }),
                                              };
                                            });

                                          newExercise.sets = [...updatedSets];

                                          const newExercises =
                                            selectedSuperset.exercises.map(
                                              (ex) => {
                                                if (ex.id === exercise.id) {
                                                  return newExercise;
                                                }
                                                return ex;
                                              }
                                            );

                                          const newSuperset = {
                                            ...selectedSuperset,
                                            exercises: newExercises,
                                          };

                                          setSelectedSuperset((prev) => {
                                            if (!prev) return undefined;
                                            return newSuperset;
                                          });

                                          const newSupersets =
                                            trainingInProgress.supersets.map(
                                              (superset, j) => {
                                                if (
                                                  j ===
                                                  trainingInProgress.supersetIndex
                                                ) {
                                                  return newSuperset;
                                                }
                                                return superset;
                                              }
                                            );

                                          setTrainingInProgress((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              supersets: newSupersets,
                                            } as AthleteTrainingInProgress;
                                          });
                                        }}
                                      />
                                    </Box>
                                  );
                                })}
                            </Box>
                          );
                        })}
                      </Box>
                    </Grid2>
                  </Grid2>
                </Box>
              );
            })}
          </Box>

          <Fab
            sx={{
              backgroundColor: theme.palette.primary.main,
              position: 'absolute',
              bottom: 60,
              left: 16,
            }}
            onClick={handleOpenMenu}
          >
            <MoreVertIcon />
          </Fab>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: { mb: 1 }, // Adds a small margin between the FAB and menu
            }}
          >
            <MenuItem onClick={handleContinue}>
              {trainingInProgress.supersets.indexOf(selectedSuperset) ===
              trainingInProgress.supersets.length - 1 ? (
                <>
                  <DoneIcon sx={{ marginRight: 1 }} />
                  Finish Training
                </>
              ) : (
                <>
                  <ArrowForwardIcon sx={{ marginRight: 1 }} />
                  Next Superset
                </>
              )}
            </MenuItem>
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <CloseIcon sx={{ marginRight: 1 }} />
              Cancel Training
            </MenuItem>
          </Menu>
          <MyModal
            isOpen={openNextSupersetModal}
            setIsOpen={(open) => setOpenNextSupersetModal(open)}
            cancelText="Cancel"
            onCancel={() => setOpenNextSupersetModal(false)}
            onConfirm={() => {
              setSelectedSuperset(
                trainingInProgress.supersets[
                  trainingInProgress.supersets.indexOf(selectedSuperset) + 1
                ]
              );
              if (!trainingInProgress.supersetIndex) {
                setTrainingInProgress(
                  (prev) =>
                    ({
                      ...prev,
                      supersetIndex: 1,
                    }) as AthleteTrainingInProgress
                );
              } else {
                setTrainingInProgress(
                  (prev: AthleteTrainingInProgress | null) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      supersetIndex: prev.supersetIndex + 1,
                    } as AthleteTrainingInProgress;
                  }
                );
              }
              setOpenNextSupersetModal(false);
              if (boxRef.current) {
                boxRef.current.scrollTop = 0; // Scroll to the top
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{ width: '100%', textAlign: 'center' }}
            >
              Move to next superset?
            </Typography>
          </MyModal>
          <MyModal
            isOpen={openVideoPlayerModal}
            setIsOpen={(open) => setOpenVideoPlayerModal(open)}
            cancelText="Close"
            onCancel={() => {
              setVideoUrl('');
              setOpenVideoPlayerModal(false);
            }}
            sx={{ p: videoUrl.length > 0 ? 0 : undefined }}
            dialogueContentSx={{ p: videoUrl.length > 0 ? 0 : undefined }}
          >
            {videoUrl.length > 0 ? (
              <Box
                component="video"
                src={videoUrl}
                controls
                autoPlay
                muted
                loop
                sx={{
                  width: '100%', // Make it responsive
                  maxWidth: screenSize.isLandscapeMobile ? 400 : 600, // Limit max width
                }}
              />
            ) : (
              <Typography variant="body2">No video available</Typography>
            )}
          </MyModal>
        </Box>
      ) : (
        <Box
          display="flex"
          width="100vw"
          height="100vh"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h6">No exercises</Typography>
          <Fab
            sx={{
              backgroundColor: theme.palette.primary.main,
              position: 'absolute',
              bottom: 60,
              left: 16,
            }}
            onClick={handleOpenMenu}
          >
            <MoreVertIcon />
          </Fab>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: { mb: 1 }, // Adds a small margin between the FAB and menu
            }}
          >
            <MenuItem onClick={handleFinishTraining}>
              <DoneIcon sx={{ marginRight: 1 }} />
              Finish Training
            </MenuItem>
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <CloseIcon sx={{ marginRight: 1 }} />
              Cancel Training
            </MenuItem>
          </Menu>
        </Box>
      )}
      <MyModal
        isOpen={openFinishTrainingModal}
        setIsOpen={(open) => setOpenFinishTrainingModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenFinishTrainingModal(false)}
        onConfirm={() => {
          handleFinishTraining();
          setOpenFinishTrainingModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Finish Training?
        </Typography>
      </MyModal>
      <MyModal
        isOpen={openCancelTrainingModal}
        setIsOpen={(open) => setOpenCancelTrainingModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenCancelTrainingModal(false)}
        onConfirm={() => {
          handleCancelTraining();
          setOpenCancelTrainingModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Cancel Training?
        </Typography>
      </MyModal>
    </>
  );
}
