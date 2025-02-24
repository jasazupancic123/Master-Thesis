import { COLOR } from '@/common/constant/browser.constant';
import {
  DISTANCE_OPTIONS,
  RECOVERY,
  REP_OPTIONS,
  SET,
  SET_TYPE,
  TEMPO,
  TIME_OPTIONS,
  VO2_OPTIONS,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { handleApiRequest } from '@/common/type/state.type';
import { useScreenSize } from '@/context/screen-size-provider';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { TrainingController } from '@/controller/training/training.controller';
import {
  ExerciseMeta,
  Superset,
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { WorkloadData } from '@/controller/training/type/user-workload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  FormControl,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useTheme,
} from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import BorderColor from '../border-color';
import { AthleteTrainingExerciseCardProps } from './props';
import TrainingExerciseCardContainer from '../trainer-day-view/training-exercise-card-container';
import TrainingExerciseCard from '../trainer-day-view/training-exercise-card';
import { SetExerciseAttribute } from '../trainer-day-view/exercise-card-set-attribute';
import dayjs from 'dayjs';

export default function AthleteTrainingExerciseCard(
  props: AthleteTrainingExerciseCardProps
) {
  const { userId, components, training } = props;
  const theme = useTheme();
  const screenSize = useScreenSize();

  const [component, setComponent] = useState<TrainingComponent>(components[0]);
  const [selectedSuperset, setSelectedSuperset] = useState<Superset | null>(
    null
  );
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [states, setStates] = useState<ExerciseMeta[]>([]);
  const [tempoOrEfforts, setTempoOrEfforts] = useState<('temp' | 'eff')[]>([]);

  useEffect(() => {
    if (!selectedSuperset) return;
    const newExercises = selectedSuperset.exercises;
    setSelectedExercises(newExercises);
    if (!newExercises || newExercises.length === 0) return;
    const newStates = newExercises.map((exercise) => exercise.meta);
    setStates(newStates);
    if (!newStates || newStates.length === 0) return;
    const newTempoOrEfforts = newStates.map((state) =>
      state.tempo ? 'temp' : 'eff'
    );
    setTempoOrEfforts(newTempoOrEfforts);
  }, [selectedSuperset]);

  function getSupersets(component: TrainingComponent) {
    return (
      component.subgroups.find((s) => s.membersIds.includes(userId)) ||
      component
    ).supersets;
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box width="100%" display="flex" justifyContent="center">
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          sx={{
            borderRadius: 2,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Box
            display="flex"
            width="100%"
            alignItems="center"
            sx={{
              overflow: 'visible',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              overflowX: screenSize.isSmallerThanLaptop
                ? 'scroll'
                : components.length > 4
                  ? 'scroll'
                  : 'hidden',
              '&::-webkit-scrollbar': { height: '8px' },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              },
              scrollbarWidth: 'thin',
              scrollbarColor: `rgba(187, 187, 187, 0.5) ${theme.palette.background.default}`,
              backgroundColor: '#253544',
              px: 1,
            }}
          >
            {components.map((c, _, arr) =>
              c.id === component.id ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  key={`${c.id}`}
                  sx={{
                    backgroundColor: 'background.paper',
                    border: '1px solid #1eb980',
                    borderRadius: 3,
                    px: 2,
                    py: 0.5,
                    flex:
                      arr.length > 4 ? '0 0 auto' : `1 1 ${100 / arr.length}%`,
                    width: screenSize.isSmallerThanLaptop
                      ? undefined
                      : arr.length > 4
                        ? '25%'
                        : `${100 / arr.length}%`,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: '#1eb980',
                      zIndex: 1,
                      height: 25,
                      mb: 0.5,
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {c.id}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'white',
                      zIndex: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {dayjs(c.from).format('hh:mm A')[0] === '0'
                      ? dayjs(c.from).format('hh:mm A').substring(1)
                      : dayjs(c.from).format('hh:mm A')}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  key={`component-${c.id}`}
                  variant={screenSize.isMobile ? 'h6' : 'h5'}
                  sx={{
                    flex:
                      arr.length > 4 ? '0 0 auto' : `1 1 ${100 / arr.length}%`,
                    width: screenSize.isSmallerThanLaptop
                      ? undefined
                      : arr.length > 4
                        ? '25%'
                        : `${100 / arr.length}%`,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: '#a7a9ae',
                    backgroundColor: '#253544',
                    px: 2,
                    py: 1,
                    zIndex: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setComponent(c)}
                >
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    {c.id}
                  </Box>
                </Typography>
              )
            )}
          </Box>

          <CardContent
            sx={{
              backgroundColor: theme.palette.background.default,
              px: 2,
            }}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {component.supersets.map((superset, i) => (
                <Box key={`superset-${component.id}-${i}`}>
                  <BorderColor
                    color={COLOR[i % COLOR.length]}
                    applyMargin
                    marginValue={
                      superset.exercises.length === 0 ? '3px' : '2px'
                    }
                  />

                  {superset.exercises.map((exercise, exerciseIndex) => (
                    <React.Fragment key={`exercise-fragment-${exercise.id}`}>
                      <Box
                        key={exercise.id}
                        display="flex"
                        width="100%"
                        justifyContent="center"
                        alignItems="center"
                        borderTop="3px solid #323f4b"
                        sx={{ backgroundColor: '#3c4854' }}
                        py={0.5}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          {exercise.exercise?.name || 'Unnamed Exercise'}
                        </Typography>

                        {exerciseIndex === 0 && (
                          <IconButton
                            onClick={() => {
                              if (superset === selectedSuperset) {
                                setSelectedSuperset(null);
                                setSelectedExercises([]);
                                setStates([]);
                                setTempoOrEfforts([]);
                              } else {
                                setSelectedSuperset(superset);
                              }
                            }}
                            sx={{
                              py: 0,
                              m: 0,
                              position: 'absolute',
                              right: screenSize.isMobile ? 11 : 20,
                            }}
                          >
                            {selectedSuperset === superset &&
                            states.length > 0 &&
                            tempoOrEfforts.length > 0 ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        )}
                      </Box>
                      {selectedExercises.includes(exercise) &&
                        states.length > 0 &&
                        tempoOrEfforts.length > 0 && (
                          <Box
                            key={`${exercise.id}-box`}
                            sx={{
                              p: 0,
                              m: 0,
                              pb: 2,
                              position: 'relative',
                              backgroundColor: '#3c4854',
                            }}
                          >
                            <Box
                              position="absolute"
                              display="flex"
                              flexDirection="column"
                              top={-30}
                              left={10}
                              zIndex={1000}
                            >
                              <Typography
                                variant="caption"
                                color="rgb(124, 128, 132)"
                              >
                                {`${i + 1}${String.fromCharCode(65 + exerciseIndex)}`}
                              </Typography>
                            </Box>
                            <Grid2 container spacing={1} columns={10}>
                              {/* Sets */}
                              <Grid2 size={2}>
                                <SetExerciseAttribute
                                  options={SET}
                                  disabled={true}
                                  state={(() => {
                                    const option = SET.find(
                                      (option) => option.label === 'sets'
                                    )!;
                                    return {
                                      type: option.type,
                                      label: option.label,
                                      values: option.values,
                                      option:
                                        option.label as keyof ExerciseMeta,
                                      format: option.format,
                                      value:
                                        states[exerciseIndex].sets.toString() ??
                                        option.values![1].toString(),
                                    };
                                  })()}
                                  onChange={() => {}}
                                />
                              </Grid2>
                              {/* Set Type */}
                              <Grid2 size={2}>
                                <SetExerciseAttribute
                                  options={SET_TYPE}
                                  disabled={true}
                                  state={(() => {
                                    const option = SET_TYPE.find(
                                      (option) =>
                                        option.label ===
                                        states[exerciseIndex].setType
                                    )!;

                                    return {
                                      type: option.type,
                                      label: option.label,
                                      values: option.values,
                                      option:
                                        option.label as keyof ExerciseMeta,
                                      format: option.format,
                                      value:
                                        states[
                                          exerciseIndex
                                        ].setTypeValue.toString() ??
                                        option.values![1].toString(),
                                    };
                                  })()}
                                  onChange={() => {}}
                                />
                              </Grid2>
                              {/* Workload */}
                              <Grid2 size={2}>
                                <SetExerciseAttribute
                                  options={WORKLOAD}
                                  disabled={true}
                                  state={(() => {
                                    const option = WORKLOAD.find(
                                      (option) =>
                                        option.label ===
                                        states[exerciseIndex].workloadType
                                    )!;

                                    return {
                                      type: option.type,
                                      label: option.label,
                                      values: option.values,
                                      option:
                                        option.label as keyof ExerciseMeta,
                                      format: option.format,
                                      value: (
                                        states[exerciseIndex].workloadValue ||
                                        10
                                      ).toString(),
                                    };
                                  })()}
                                  onChange={() => {}}
                                />
                              </Grid2>

                              {/* Tempo */}
                              <Grid2 size={2}>
                                <SetExerciseAttribute
                                  options={TEMPO}
                                  disabled={true}
                                  state={(() => {
                                    const option = TEMPO.find(
                                      (option) =>
                                        option.label ===
                                        tempoOrEfforts[exerciseIndex]
                                    )!;

                                    return {
                                      type: option.type,
                                      label: option.label,
                                      values: option.values,
                                      option:
                                        option.label as keyof ExerciseMeta,
                                      format: option.format,
                                      value:
                                        (tempoOrEfforts[exerciseIndex] ===
                                        'temp'
                                          ? states[exerciseIndex].tempo
                                          : states[exerciseIndex].effort) ??
                                        option.values![1].toString(),
                                    };
                                  })()}
                                  onChange={() => {}}
                                />
                              </Grid2>
                              {/* Recovery */}
                              <Grid2 size={2}>
                                <SetExerciseAttribute
                                  options={RECOVERY}
                                  disabled={true}
                                  state={(() => {
                                    const option = RECOVERY.find(
                                      (option) => option.label === 'rec'
                                    )!;
                                    return {
                                      type: option.type,
                                      label: option.label,
                                      values: option.values,
                                      option:
                                        option.label as keyof ExerciseMeta,
                                      format: option.format,
                                      value: states[exerciseIndex].rec
                                        ? states[exerciseIndex].rec.toString()
                                        : '',
                                    };
                                  })()}
                                  onChange={() => {}}
                                />
                              </Grid2>
                            </Grid2>
                          </Box>
                        )}
                    </React.Fragment>
                  ))}

                  {superset.exercises.length === 0 && (
                    <BorderColor
                      color={COLOR[i % COLOR.length]}
                      lower
                      applyMargin
                      marginValue={
                        superset.exercises.length === 0 ? '3px' : '5px'
                      }
                    />
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Box>
      </Box>
    </Box>
  );
}
