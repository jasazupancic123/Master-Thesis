import {
  Superset,
  TrainingComponent,
} from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import {
  Box,
  FormControl,
  Grid2,
  MenuItem,
  Select,
  Typography,
  Fab,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User } from '@/controller/user/type/user.type';
import MyModal from '../modal';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneIcon from '@mui/icons-material/Done';
import {
  ExerciseMetaQuery,
  WorkloadData,
  WorkloadDataForExercise,
} from '@/controller/training/type/user-workload';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';
import { useScreenSize } from '@/context/screen-size-provider';
import Animation from '../animation';
import { useTraining } from '@/context/training-provider';

interface TrainingInProgressProps {
  selectedTraining: Training;
  selectedComponent: TrainingComponent;
  profile: User;
  token: string;
  setView: (view: 'exercises' | 'training') => void;
  setSelectedComponent: (component: TrainingComponent | null) => void;
}

export type TrainingResult = {
  supersets: {
    exercises: {
      id: string;
      name: string;
      meta: WorkloadDataForExercise[];
    }[];
  }[];
};

export default function TrainingInProgress(props: TrainingInProgressProps) {
  const screenSize = useScreenSize();
  const {
    trainingResult,
    setTrainingResult,
    clearTrainingState,
    supersetIndex,
    setSupersetIndex
  } = useTraining();
  const {
    selectedTraining,
    selectedComponent,
    profile,
    token,
    setView,
    setSelectedComponent,
  } = props;
  const [selectedSuperset, setSelectedSuperset] = useState<
    Superset | undefined
  >();
  const [supersets, setSupersets] = useState<Superset[]>();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [openNextSupersetModal, setOpenNextSupersetModal] = useState(false);
  const [openFinishTrainingModal, setOpenFinishTrainingModal] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(true);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let usersSupersets = undefined;
    for (const subgroup of selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) usersSupersets = selectedComponent.supersets; //default group

    const result = { supersets: [] } as TrainingResult;
    for (const superset of usersSupersets) {
      const exercises = [] as {
        id: string;
        name: string;
        meta: WorkloadDataForExercise[];
      }[];
      for (const exercise of superset.exercises) {
        const exerciseObjet = {
          id: exercise.exercise?.id || '',
          name: exercise.exercise?.name || '',
          meta: [] as WorkloadDataForExercise[],
        };
        for (let i = 0; i < exercise.meta.sets; i++) {
          exerciseObjet.meta.push({
            setNumber: i + 1,
            setTypeValue: exercise.meta.setTypeValue,
            workloadValue: exercise.meta.workloadValue,
          } as WorkloadDataForExercise);
        }
        exercises.push(exerciseObjet);
      }
      result.supersets.push({ exercises });
    }

    if(trainingResult === null)
      setTrainingResult(result);
    setSupersets(usersSupersets);
    if(!supersetIndex)
      setSelectedSuperset(usersSupersets[0]);
    else 
      setSelectedSuperset(usersSupersets[supersetIndex]);
  }, [selectedComponent]);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFinishTraining = async () => {
    if (!trainingResult) {
      toast.error('An error occurred');
      return;
    }
    const queries = [] as ExerciseMetaQuery[];
    const data = [] as WorkloadData[];
    for (const superset of trainingResult.supersets) {
      for (const exercise of superset.exercises) {
        for (const set of exercise.meta) {
          for (const rep of Array.from(
            { length: set.setTypeValue },
            (_, i) => i + 1
          )) {
            data.push({
              setNumber: set.setNumber,
              repNumber: rep,
              setTypeValue: set.setTypeValue,
              workloadValue: set.workloadValue,
            } as WorkloadData);
          }
        }
        queries.push({
          exerciseId: exercise.id,
          data,
        });
      }
    }

    try {
      for (const query of queries) {
        await TrainingController.updateAthleteWorkloadData(
          token,
          selectedTraining.id,
          query.exerciseId,
          { data: query.data }
        );
      }
      toast.success('Training data updated successfully');
      clearTrainingState();
      setView('exercises');
      setSelectedComponent(null);
      setSelectedSuperset(undefined);
    } catch (e) {
      toast.error(e as any);
    }
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          color="#1EB980"
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
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{
          overflowY: screenSize.isLandscapeMobile ? undefined : 'scroll',
          maxHeight: '100vh',
        }}
      >
        {selectedSuperset.exercises.map((exercise, i) => (
          <Box
            key={exercise.id}
            width="100%"
            display="flex"
            flexDirection="column"
            sx={{ position: 'relative' }}
          >
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
                  ? 38
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
                  src="/deadlift.png"
                  alt="Exercise Image"
                  width={!screenSize.isMobile ? 200 : 170}
                  height={0}
                  style={{
                    maxWidth: !screenSize.isMobile ? '200px' : '170px',
                    height: 'auto', // Maintains aspect ratio dynamically
                    borderRadius: 15,
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
                    justifyContent={!screenSize.isMobile ? 'center' : undefined}
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
                  {Array.from({ length: exercise.meta.sets }, (_, index) => (
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
                              '& .mui-odhiz8-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input':
                                {
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
                              '& .mui-odhiz8-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input':
                                {
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
        ))}
      </Box>

      <Fab
        sx={{
          backgroundColor: '#1EB980',
          position: 'fixed',
          bottom: screenSize.isLandscapeMobile ? 60 : 70,
          right: 16,
        }} // Adjust for mobile
        onClick={() => {
          if (supersets.indexOf(selectedSuperset) === supersets.length - 1) {
            setOpenFinishTrainingModal(true);
          } else {
            setOpenNextSupersetModal(true);
          }
        }}
      >
        {supersets.indexOf(selectedSuperset) === supersets.length - 1 ? (
          <DoneIcon />
        ) : (
          <ArrowForwardIcon />
        )}
      </Fab>
      <MyModal
        isOpen={openNextSupersetModal}
        setIsOpen={(open) => setOpenNextSupersetModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenNextSupersetModal(false)}
        onConfirm={() => {
          setSelectedSuperset(
            supersets[supersets.indexOf(selectedSuperset) + 1]
          );
          if(!supersetIndex)
            setSupersetIndex(1)
          else 
            setSupersetIndex(supersetIndex + 1);
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
    </Box>
  ) : (
    <Typography variant="h6">No training scheduled</Typography>
  );
}
