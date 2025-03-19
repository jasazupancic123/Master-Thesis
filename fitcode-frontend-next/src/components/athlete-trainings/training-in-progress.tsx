import { handleApiRequest, SetState } from '@/common/type/state.type';
import { useAthlete } from '@/context/athlete-provider';
import { useAuth } from '@/context/auth-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTraining } from '@/context/training-provider';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { TrainingController } from '@/controller/training/training.controller';
import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import {
  Training,
  TrainingStatus,
} from '@/controller/training/type/training.type';
import {
  ExerciseMetaQuery,
  WorkloadData,
} from '@/controller/training/type/user-workload';
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
import Animation from '../animation';
import MyModal from '../modal';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import MediapipePoseDetection from './mediapipe-pose-detection';

interface TrainingInProgressProps {
  selectedTraining: Training;
  selectedComponent: TrainingComponent;
  profile: User;
  token: string;
  setView: (view: 'exercises' | 'training') => void;
  setSelectedComponent: (component: TrainingComponent | null) => void;
  statuses: TrainingStatus[];
  setStatuses: SetState<TrainingStatus[]>;
}

export type TrainingResult = {
  userId: string;
  supersets: {
    exercises: {
      id: string;
      name: string;
      meta: WorkloadData[];
    }[];
  }[];
};

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const {
    trainingResult,
    setTrainingResult,
    clearTrainingState,
    supersetIndex,
    setSupersetIndex,
    startOfTraining,
    setStartOfTraining,
    setView,
  } = useTraining();

  const {
    selectedTraining,
    selectedComponent,
    profile,
    token,
    setSelectedComponent,
    statuses,
    setStatuses,
  } = props;

  const [selectedSuperset, setSelectedSuperset] = useState<
    Superset | undefined
  >();

  const [supersets, setSupersets] = useState<Superset[]>();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [openCancelTrainingModal, setOpenCancelTrainingModal] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(true);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const [openVideoPlayerModal, setOpenVideoPlayerModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [openCameraPoseDetection, setOpenCameraPoseDetection] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    let usersSupersets = undefined;
    for (const subgroup of selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) usersSupersets = selectedComponent.supersets; //default group

    const result = { userId: user?.uid || '', supersets: [] } as TrainingResult;
    for (const superset of usersSupersets) {
      const exercises = [] as {
        id: string;
        name: string;
        meta: WorkloadData[];
      }[];

      for (const exercise of superset.exercises) {
        const exerciseObject = {
          id: exercise.exercise?.id || '',
          name: exercise.exercise?.name || '',
          meta: [] as WorkloadData[],
        };

        for (let i = 0; i < exercise.meta.set; i++)
          exerciseObject.meta.push({
            setTypeValue: exercise.meta.setTypeValue,
            workloadValue: exercise.meta.workloadValue,
          });

        exercises.push(exerciseObject);
      }

      result.supersets.push({ exercises });
    }

    if (trainingResult === null) {
      setTrainingResult(result);
      setStartOfTraining(dayjs());
    }
    setSupersets(usersSupersets);

    if (!supersetIndex) setSelectedSuperset(usersSupersets[0]);
    else setSelectedSuperset(usersSupersets[supersetIndex]);
  }, [selectedComponent]);

  useEffect(() => {
    if (!startOfTraining) return; // Ensure startOfTraining is set

    const startTime = dayjs(startOfTraining).valueOf(); // Convert to timestamp
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000)); // Get seconds difference
    }, 1000);

    return () => clearInterval(interval);
  }, [startOfTraining]); // Re-run if startOfTraining changes

  const handleFinishTraining = async () => {
    if (!trainingResult) return toast.error('An error occurred');

    const queries = [] as ExerciseMetaQuery[];

    for (const superset of trainingResult.supersets)
      for (const exercise of superset.exercises) {
        const data = [] as WorkloadData[];
        for (const set of exercise.meta) {
          data.push({
            setTypeValue: set.setTypeValue,
            workloadValue: set.workloadValue,
          });
        }

        queries.push({ exerciseId: exercise.id, data });
      }

    handleApiRequest(
      router,
      () =>
        TrainingController.createUserWorkloadsForComponent(
          token,
          selectedTraining.id,
          selectedComponent.id,
          { workloads: queries }
        ),
      () => {
        toast.success('Training data updated successfully');
        setStatuses((prev) => [
          ...prev,
          {
            componentId: selectedComponent.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: SetStatus.COMPLETED,
            trainingId: selectedTraining.id,
            userId: profile.uid,
          },
        ]);
        clearTrainingState();
        setView('exercises');
        setSelectedComponent(null);
        setSelectedSuperset(undefined);
      },
      undefined,
      'Failed to update training data'
    );
  };

  const handleCancelTraining = () => {
    clearTrainingState();
    setView('exercises');
    setSelectedComponent(null);
    setSelectedSuperset(undefined);
  };

  const handleValueChange = (
    value: number,
    type: 'workloadValue' | 'setTypeValue',
    exerciseIndex: number,
    setIndex: number
  ) => {
    if (!selectedSuperset || !supersets || !trainingResult) return;
    const resultCopy = { ...trainingResult };
    const supersetIndex = supersets.indexOf(selectedSuperset);
    const exercise =
      resultCopy.supersets[supersetIndex].exercises[exerciseIndex];
    exercise.meta[setIndex][type] = value;

    setTrainingResult(resultCopy);
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
    if (!supersets || !selectedSuperset) return;
    handleCloseMenu();
    if (supersets.indexOf(selectedSuperset) === supersets.length - 1) {
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
  ) : openCameraPoseDetection ? (
    <MediapipePoseDetection
      setOpenCameraPoseDetection={setOpenCameraPoseDetection}
    />
  ) : supersets && selectedSuperset ? (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
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
          Superset {supersets.indexOf(selectedSuperset) + 1}
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
          {selectedComponent.id}
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
          return (
            <Box
              key={exercise.id}
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
                    exercise.exercise?.name.toLowerCase() !== 'deep back squat'
                      ? 'none'
                      : undefined,
                }}
                onClick={() => {
                  setOpenCameraPoseDetection(true);
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
                  {`${supersets.indexOf(selectedSuperset) + 1}${String.fromCharCode(65 + i)}`}
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
                  size={6}
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
                <Grid2
                  size={6}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box
                    width="100%"
                    display="flex"
                    flexDirection={'column'}
                    px={1}
                  >
                    <Grid2
                      container
                      size={12}
                      mt={1}
                      gap={0.5}
                      display={!screenSize.isMobile ? 'flex' : undefined}
                      width={!screenSize.isMobile ? '100%' : undefined}
                      justifyContent={
                        !screenSize.isMobile ? 'center' : undefined
                      }
                    >
                      <Grid2
                        size={!screenSize.isMobile ? 0.3 : 1}
                        display="flex"
                        alignItems="center"
                      />
                      <Grid2
                        size={3}
                        maxWidth={!screenSize.isMobile ? 80 : undefined}
                        minWidth={screenSize.isMobile ? '42.5%' : 90}
                        display="flex"
                        justifyContent="center"
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#969da3',
                            textAlign: 'center',
                            fontSize: 11,
                          }}
                        >
                          {exercise.meta.workloadType[0].toUpperCase() +
                            exercise.meta.workloadType.slice(1)}
                        </Typography>
                      </Grid2>
                      <Grid2
                        size={3}
                        maxWidth={!screenSize.isMobile ? 80 : undefined}
                        minWidth={screenSize.isMobile ? '42.5%' : 90}
                        display="flex"
                        justifyContent="center"
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#969da3',
                            textAlign: 'center',
                            fontSize: 11,
                          }}
                        >
                          {exercise.meta.setType[0].toUpperCase() +
                            exercise.meta.setType.slice(1)}
                        </Typography>
                      </Grid2>
                    </Grid2>
                    {Array.from({ length: exercise.meta.set }, (_, index) => (
                      <Grid2
                        container
                        size={12}
                        key={index}
                        gap={0.5}
                        my={0.25}
                        display={!screenSize.isMobile ? 'flex' : undefined}
                        width={!screenSize.isMobile ? '100%' : undefined}
                        justifyContent={
                          !screenSize.isMobile ? 'center' : undefined
                        }
                      >
                        <Grid2
                          size={!screenSize.isMobile ? 0.5 : 1}
                          display="flex"
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#969da3',
                              textAlign: 'center',
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              fontSize: 11,
                            }}
                          >
                            Set {index + 1}
                          </Typography>
                        </Grid2>
                        <Grid2
                          size={3}
                          maxWidth={!screenSize.isMobile ? 80 : undefined}
                          minWidth={screenSize.isMobile ? '42.5%' : 90}
                          display="flex"
                          alignItems="center"
                        >
                          {/* Workload Input */}
                          <FormControl
                            fullWidth
                            sx={{
                              maxWidth: !screenSize.isMobile ? 80 : undefined,
                            }}
                          >
                            <Select
                              value={
                                trainingResult?.supersets[
                                  supersets.indexOf(selectedSuperset)
                                ].exercises[i].meta[index].workloadValue
                              }
                              onChange={(e) => {
                                handleValueChange(
                                  e.target.value as number,
                                  'workloadValue',
                                  i,
                                  index
                                );
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  whiteSpace: !screenSize.isUltraSmall
                                    ? 'nowrap'
                                    : undefined,
                                  display: 'flex',
                                  width: '100%',
                                  ml: screenSize.isUltraSmall ? 1.4 : undefined,
                                  justifyContent: 'center !important',
                                  textAlign: 'center',
                                },
                                '& .MuiSelect-select': {
                                  padding: '4px 16px', // Adjust as needed
                                  fontSize:
                                    screenSize.isReallySmall &&
                                    !screenSize.isUltraSmall
                                      ? '80%'
                                      : screenSize.isUltraSmall
                                        ? '80%'
                                        : undefined,
                                  whiteSpace: 'nowrap',
                                },
                                '& .MuiSelect-input': {
                                  width: '100%',
                                  whiteSpace: 'nowrap',
                                },
                                '& .MuiSelect-icon': {
                                  display: screenSize.isUltraSmall
                                    ? 'none'
                                    : undefined,
                                },
                              }}
                            >
                              {Array.from({ length: 300 }, (_, i) => (
                                <MenuItem
                                  key={i + 1}
                                  value={i + 1}
                                  sx={{ textAlign: 'center' }}
                                >
                                  {i + 1}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid2>
                        <Grid2
                          size={3}
                          maxWidth={!screenSize.isMobile ? 80 : undefined}
                          minWidth={screenSize.isMobile ? '42.5%' : 90}
                          display="flex"
                          alignItems="center"
                        >
                          <FormControl
                            fullWidth
                            sx={{
                              maxWidth: !screenSize.isMobile ? 80 : undefined,
                            }}
                          >
                            <Select
                              value={
                                trainingResult?.supersets[
                                  supersets.indexOf(selectedSuperset)
                                ].exercises[i].meta[index].setTypeValue
                              }
                              onChange={(e) => {
                                handleValueChange(
                                  e.target.value as number,
                                  'setTypeValue',
                                  i,
                                  index
                                );
                              }}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    whiteSpace: 'nowrap',
                                  },
                                },
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  whiteSpace: !screenSize.isUltraSmall
                                    ? 'nowrap'
                                    : undefined,
                                  display: 'flex',
                                  width: '100%',
                                  ml: screenSize.isUltraSmall ? 1.4 : undefined,
                                  justifyContent: 'center !important',
                                  textAlign: 'center',
                                },
                                '& .MuiSelect-select': {
                                  padding: '4px 16px', // Adjust as needed
                                  fontSize:
                                    screenSize.isReallySmall &&
                                    !screenSize.isUltraSmall
                                      ? '80%'
                                      : screenSize.isUltraSmall
                                        ? '80%'
                                        : undefined,
                                  whiteSpace: 'nowrap',
                                },
                                '& .MuiSelect-input': {
                                  width: '100%',
                                  whiteSpace: 'nowrap',
                                },
                                '& .MuiSelect-icon': {
                                  display: screenSize.isUltraSmall
                                    ? 'none'
                                    : undefined,
                                },
                              }}
                            >
                              {Array.from({ length: 50 }, (_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>
                                  {i + 1}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid2>
                      </Grid2>
                    ))}
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
          {supersets.indexOf(selectedSuperset) === supersets.length - 1 ? (
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
            supersets[supersets.indexOf(selectedSuperset) + 1]
          );
          if (!supersetIndex) setSupersetIndex(1);
          else setSupersetIndex(supersetIndex + 1);
          setOpenNextSupersetModal(false);
          if (boxRef.current) {
            boxRef.current.scrollTop = 0; // Scroll to the top
          }
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Move to next superset?
        </Typography>
      </MyModal>
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
    <Typography variant="h6">No training scheduled</Typography>
  );
}
