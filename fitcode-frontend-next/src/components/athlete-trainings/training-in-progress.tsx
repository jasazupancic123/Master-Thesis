import { handleApiRequest, SetState } from '@/common/type/state.type';
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
import dynamic from 'next/dynamic';
import { ExerciseParam } from '../trainer-day-view/exercise-card/exercise-param';

interface TrainingInProgressProps {
  selectedTraining: Training;
  selectedComponent: TrainingComponent;
  profile: User;
  token: string;
  setView: (view: 'exercises' | 'training') => void;
  setSelectedComponent: (component: TrainingComponent | null) => void;
  setTrainings: SetState<Training[]>;
}

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const {
    clearTrainingState,
    supersetIndex,
    setSupersetIndex,
    startOfTraining,
    setStartOfTraining,
    setView,
    setSelectedTraining,
  } = useTraining();

  const {
    selectedTraining,
    selectedComponent,
    profile,
    token,
    setSelectedComponent,
    setTrainings,
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

    if (!selectedTraining) {
      setStartOfTraining(dayjs());
    }
    setSupersets(usersSupersets);

    if (!supersetIndex) setSelectedSuperset(usersSupersets[0]);
    else setSelectedSuperset(usersSupersets[supersetIndex]);
  }, [selectedComponent]);

  useEffect(() => {
    if (!startOfTraining) {
      setStartOfTraining(dayjs()); // Set start time to now
      return;
    }

    const startTime = dayjs(startOfTraining).valueOf(); // Convert to timestamp
    const interval = setInterval(() => {
      const now = dayjs().valueOf();
      setElapsedTime(Math.floor((now - startTime) / 1000)); // Get seconds difference
    }, 1000);

    return () => clearInterval(interval);
  }, [startOfTraining]); // Re-run if startOfTraining changes

  useEffect(() => {}, [elapsedTime]);

  const handleFinishTraining = async () => {
    clearTrainingState();
    setView('exercises');
    setSelectedComponent(null);
    setSelectedSuperset(undefined);

    if (!selectedTraining || !user || !selectedComponent)
      return toast.error('An error occurred');

    handleApiRequest(
      router,
      () =>
        TrainingController.finishComponent(
          token,
          selectedTraining.id,
          user.uid,
          selectedComponent.id
        ),
      (training) => {
        console.log('training', training);
        toast.success('Training data updated successfully');
        clearTrainingState();
        setView('exercises');
        setSelectedComponent(null);
        setSelectedSuperset(undefined);
        setTrainings((prev) =>
          prev.map((t) => {
            if (t.id === training.id) return training;
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
    setSelectedComponent(null);
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
  ) : (
    <>
      {supersets && selectedSuperset ? (
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
                    <Grid2 size={6} px={1}>
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
                              {Array.isArray(exercise.params) &&
                                exercise.params.map((param, j) => {
                                  const value = set.paramValues.find(
                                    (pv) => pv.field === param.field
                                  ) || {
                                    field: param.field,
                                    selected: 'set',
                                    value: (i + 1).toString(),
                                  };

                                  return (
                                    <Box
                                      key={param.field}
                                      flexBasis={
                                        (
                                          100 / exercise.params.length
                                        ).toString() + '%'
                                      }
                                    >
                                      <ExerciseParam
                                        showOptions={set.setNumber === 1}
                                        disableOptions
                                        disableSets
                                        param={param}
                                        value={value}
                                        onOptionChange={(newValue) => {}}
                                        onSubOptionChange={(newValue) => {}}
                                        readOnly={true}
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
