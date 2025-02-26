import { COLOR } from '@/common/constant/browser.constant';
import {
  RECOVERY,
  SET,
  SET_TYPE,
  TEMPO,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { useScreenSize } from '@/context/screen-size-provider';
import {
  ExerciseMeta,
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Grid2, IconButton } from '@mui/material';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import BorderColor from '../border-color';
import { AthleteTrainingExerciseCardProps } from './props';
import { SetExerciseAttribute } from '../trainer-day-view/exercise-card-set-attribute';
import SportsIcon from '@mui/icons-material/Sports';
import { open } from 'node:inspector/promises';
import MyModal from '../modal';
import Animation from '../animation';
import { useTraining } from '@/context/training-provider';

export default function AthleteTrainingExerciseCard(
  props: AthleteTrainingExerciseCardProps
) {
  const { components, setView, training, profile } = props;
  const screenSize = useScreenSize();

  const {
    selectedTraining,
    setSelectedTraining,
    selectedComponent,
    setSelectedComponent,
  } = useTraining();

  const [selectedSuperset, setSelectedSuperset] = useState<Superset | null>(
    null
  );
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [supersets, setSupersets] = useState<Superset[]>();
  const [states, setStates] = useState<ExerciseMeta[]>([]);
  const [tempoOrEfforts, setTempoOrEfforts] = useState<('temp' | 'eff')[]>([]);
  const [openAreYouSureModal, setOpenAreYouSureModal] = useState(false);

  useEffect(() => {
    if (!selectedComponent) return;
    let usersSupersets = undefined;
    for (const subgroup of selectedComponent.subgroups) {
      if (subgroup.membersIds.includes(profile.uid)) {
        usersSupersets = subgroup.supersets;
        break;
      }
    }
    if (!usersSupersets) {
      usersSupersets = selectedComponent.supersets; //default group
    }
    setSupersets(usersSupersets);
  }, [selectedComponent]);

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
          <Box display="flex" flexDirection="column" width="100%" gap={0.25}>
            {components.map((c, i, arr) =>
              c.id === selectedComponent?.id &&
              training.id === selectedTraining?.id ? (
                <Box
                  key={c.id}
                  display="flex"
                  flexDirection="column"
                  sx={{
                    p: 0,
                    pt: 0.5,
                    m: 0,
                    border: '1px solid #1EB980',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box
                    width="100%"
                    key={`${c.id}`}
                    sx={{
                      py: 1,
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        textTransform: 'uppercase',
                        color: '#1EB980',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedComponent(null);
                        setSelectedTraining(null);
                      }}
                    >
                      {c.id}
                    </Typography>
                    <IconButton
                      sx={{
                        p: 0,
                        m: 0,
                        position: 'absolute',
                        top: 7,
                        left: 12,
                      }}
                      onClick={() => setOpenAreYouSureModal(true)}
                    >
                      <SportsIcon sx={{ fontSize: 35 }} />
                    </IconButton>
                  </Box>
                  <CardContent
                    sx={{
                      px: 2,
                      pt: 0.5,
                    }}
                  >
                    <Box display="flex" flexDirection="column" gap={2}>
                      {supersets?.map((superset, i) => (
                        <Box
                          key={`superset-${selectedComponent.id}-${i}`}
                          display="flex"
                          flexDirection="column"
                          gap={0.25}
                        >
                          <BorderColor
                            color={COLOR[i % COLOR.length]}
                            applyMargin
                            marginValue={
                              superset.exercises.length === 0 ? '3px' : '2px'
                            }
                          />

                          {superset.exercises.map((exercise, exerciseIndex) => (
                            <Box
                              key={`exercise-container-${exercise.id}`}
                              display="flex"
                              flexDirection="column" // Ensures vertical stacking
                            >
                              <Box
                                key={exercise.id}
                                display="flex"
                                width="100%"
                                justifyContent="center"
                                alignItems="center"
                                sx={{ backgroundColor: '#273747' }}
                                py={0.5}
                              >
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {exercise.exercise?.name ||
                                    'Unnamed Exercise'}
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
                                      right: screenSize.isMobile ? 14 : 20,
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
                                      backgroundColor: '#273747',
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
                                              (option) =>
                                                option.label === 'sets'
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
                                                ].sets.toString() ??
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
                                                states[exerciseIndex]
                                                  .workloadType
                                            )!;

                                            return {
                                              type: option.type,
                                              label: option.label,
                                              values: option.values,
                                              option:
                                                option.label as keyof ExerciseMeta,
                                              format: option.format,
                                              value: (
                                                states[exerciseIndex]
                                                  .workloadValue || 10
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
                                                (tempoOrEfforts[
                                                  exerciseIndex
                                                ] === 'temp'
                                                  ? states[exerciseIndex].tempo
                                                  : states[exerciseIndex]
                                                      .effort) ??
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
                                                ? states[
                                                    exerciseIndex
                                                  ].rec.toString()
                                                : '',
                                            };
                                          })()}
                                          onChange={() => {}}
                                        />
                                      </Grid2>
                                    </Grid2>
                                  </Box>
                                )}
                            </Box>
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
              ) : (
                <Box
                  key={`${c.id}`}
                  width="100%"
                  sx={{
                    backgroundColor: '#404c54',
                    py: 1,
                    borderTopRightRadius: i === 0 ? 5 : 0,
                    borderBottomRightRadius: i === arr.length - 1 ? 5 : 0,
                    borderBottomLeftRadius: i === arr.length - 1 ? 5 : 0,
                  }}
                  onClick={() => {
                    setSelectedTraining(training);
                    setSelectedComponent(c);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textTransform: 'uppercase',
                      color: '#e4ece9',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {c.id}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Box>
      </Box>
      <MyModal
        isOpen={openAreYouSureModal}
        setIsOpen={(open) => setOpenAreYouSureModal(open)}
        cancelText="Cancel"
        onCancel={() => setOpenAreYouSureModal(false)}
        onConfirm={() => {
          setView('training');
          setOpenAreYouSureModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          You've smashed the training button. Ready to kick things off?
        </Typography>
      </MyModal>
    </Box>
  );
}
