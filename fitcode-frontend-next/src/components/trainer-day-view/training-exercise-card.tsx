import {
  RECOVERY,
  SET,
  SET_TYPE,
  TEMPO,
  WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { useGroup } from '@/context/group-provider';
import { Superset } from '@/controller/training/type/training-plan.type';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { Box, Grid2, IconButton, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { SetExerciseAttribute } from './exercise-card-set-attribute';
import { TrainingExerciseCardProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Circle } from '@mui/icons-material';
import { IsNan } from '@tensorflow/tfjs';
import { ExerciseParamOptions } from './exercise-params-option';
import { ComponentParam } from '@/controller/component/type/component.type';
import { preconnect } from 'react-dom';

// naredi posebej komponent za option (v02, int, rec)
// naredi posebej komponent za vsak set data (enojni select, number, string)

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const {
    exercise: exerciseProp,
    supersetIndex: j,
    selectedExercise,
    setSelectedExercise,
    chartView,
    superior,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
  } = props;

  const [exercise, setExercise] = useState(exerciseProp);

  useEffect(() => {
    console.log('updated exercise:', exercise);
  }, [exercise]);

  console.log('exercise:', exercise);

  const { setDetectedChanges, filteredTrainings, setFilteredTrainings } =
    useGroup();

  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext();

  const [expandedSetsView, setExpandedSetsView] = useState(false);

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[j!]?.exercises?.findIndex(
    (e) => e.id === exercise.id
  );

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[j!]?.exercises?.[k!];

  const setData = currentExercise?.sets?.[0];
  const params =
    currentExercise?.sets?.[0]?.paramValues
      ?.map((pv) => exercise?.params?.find((p) => p.field === pv.field)!)
      ?.filter((p) => p) || [];

  console.log('params:', params);

  const [selectedParams, setSelectedParams] = useState(() => {
    const selected: { field: string; label: string; selected: string }[] = [];
    for (const p of params) {
      const data = setData?.paramValues?.find((pv) => pv.field === p.field);

      if (data)
        selected.push({
          field: data.field,
          label: p.name,
          selected: data.selected,
        });
      else
        selected.push({
          field: p.field,
          label: p.name,
          selected: p.defaultValue || '',
        });
    }

    return selected;
  });

  function handleSuperiorExerciseUpdating(
    supersets: Superset[],
    pairs: { field: string; value: string | number }[]
  ): Superset[] {
    if (superior?.all) {
      for (const { field, value } of pairs)
        for (const superset of supersets)
          for (const exercise of superset.exercises)
            if (exercise.meta?.[field] !== undefined) {
              // (exercise.meta[field] as any) = value;
            }
    } else if (superior?.row && k !== undefined && k !== null) {
      const rowIndex = k;
      for (const { field, value } of pairs) {
        for (const superset of supersets) {
          const exercise = superset.exercises[rowIndex];
          if (!exercise) continue;
          if (exercise.meta?.[field] !== undefined) {
          }
          // (exercise.meta[field] as any) = value;
        }
      }
    }

    for (const { field, value } of pairs) {
    }
    // (supersets[j!].exercises[k!].meta[field] as any) = value;

    return supersets;
  }

  function updateSelectedTraining(
    pairs: { field: string; value: string | number }[]
  ) {
    if (!selectedSubgroup?.subgroup) {
      setTraining((training) => {
        if (!training) return undefined;

        const updatedTraining = { ...training };
        const updatedSupersets = handleSuperiorExerciseUpdating(
          updatedTraining.components[i!].supersets,
          pairs
        );
        updatedTraining.components[i!] = {
          ...updatedTraining.components[i!],
          supersets: updatedSupersets,
        };

        return updatedTraining;
      });
    } else {
      const updatedSubgroup = { ...selectedSubgroup.subgroup };
      const updatedSupersets = handleSuperiorExerciseUpdating(
        updatedSubgroup.supersets,
        pairs
      );

      setSelectedSubgroup({
        subgroup: {
          ...updatedSubgroup,
          supersets: updatedSupersets,
        },
        index: selectedSubgroup.index,
      });
    }

    setDetectedChanges(true);
  }

  function updateParamStatate(param: ComponentParam, state: any, i: number) {
    if (!training || !component) return;
    const newExercise = { ...exercise };
    newExercise.sets[i].paramValues[
      newExercise.sets[i].paramValues.findIndex((p) => p.field === param.field)
    ].value = state.value;

    setExercise(newExercise);

    const newSuperset = { ...supersets[j] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );
    if (exerciseIndex === -1) return;
    newSuperset.exercises[exerciseIndex].sets[i].paramValues[
      newSuperset.exercises[k!].sets[i].paramValues.findIndex(
        (p) => p.field === param.field
      )
    ].value = state.value;

    const newSupersets = [...supersets];
    const supersetIndex = newSupersets.findIndex(
      (s) => s.color === newSuperset.color
    );
    if (supersetIndex !== -1) newSupersets[supersetIndex] = newSuperset;

    setSupersetsWithAdd(newSupersets);

    if (selectedSubgroup?.subgroup) {
      const updatedSubgroup = {
        ...selectedSubgroup.subgroup,
        supersets: newSupersets,
      };
      const updatedComponent = {
        ...component,
        subgroups: component.subgroups.map((s, i) =>
          i === selectedSubgroup.index ? updatedSubgroup : s
        ),
      };
      setSelectedSubgroup({
        subgroup: updatedSubgroup,
        index: selectedSubgroup.index,
      });

      setComponent(updatedComponent);
      const updatedComponents = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };
      setTraining(newTraining);

      const updatedTrainings = [...filteredTrainings].map(
        (filteredTraining) => {
          if (filteredTraining.id === training.id) {
            return newTraining;
          }
          return filteredTraining;
        }
      );

      setFilteredTrainings(updatedTrainings);
    } else {
      const updatedComponent = {
        ...component,
        supersets: newSupersets,
      };

      setDetectedChanges(true);

      setComponent(updatedComponent);
      const updatedComponents = [...training.components].map((c) =>
        c.id === component.id ? updatedComponent : c
      );

      const newTraining = { ...training, components: updatedComponents };
      setTraining(newTraining);

      const updatedTrainings = filteredTrainings.map((filteredTraining) => {
        if (filteredTraining.id === training.id) {
          return newTraining;
        }
        return filteredTraining;
      });

      setFilteredTrainings(updatedTrainings);
    }
  }

  if (!training || !component || !params) return null;

  return (
    <Stack
      spacing={1}
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={2}
      sx={{
        width: '100% !important',
        my: -1,
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : exercise.exercise?.imageUrl
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.05)',
        backgroundImage: exercise.exercise?.imageUrl
          ? `url(${exercise.exercise?.imageUrl})`
          : undefined,
        backgroundPosition: 'center',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      {/* Background Overlay */}
      <Box
        sx={{
          width: '100% !important',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(38, 54, 70, 0.825)',
          zIndex: 0,
          opacity: 100,
        }}
      />
      <Stack
        direction="row"
        justifyContent="center"
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          setSelectedExercise(exercise);
          setOpenVideoPlayerModal(true);
        }}
      >
        <Tooltip title={exercise.exercise?.name} placement="top">
          <Typography
            variant="body1"
            fontWeight="bold"
            fontSize={14}
            textTransform="uppercase"
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '75%',
              zIndex: 1,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {exercise.exercise?.name}
          </Typography>
        </Tooltip>
      </Stack>

      {!expandedSetsView ? (
        <Grid2 container spacing={1} columns={11}>
          <Grid2 size={0.5}>
            <IconButton
              disableRipple
              sx={{
                p: 0,
                m: 0,
                mt: screenSize.isTablet ? 1.1 : 1,
                height: '100%',
              }}
              onClick={() => {
                setExpandedSetsView(!expandedSetsView);
              }}
            >
              <Circle
                sx={{
                  color: 'white !important',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                }}
              />
            </IconButton>
          </Grid2>

          {/* Params */}
          {params.map((p) => (
            <Grid2 size={2} key={p.field}>
              <ExerciseParamOptions
                param={p}
                state={selectedParams}
                setState={setSelectedParams}
              />
            </Grid2>
          ))}
        </Grid2>
      ) : (
        <Box display="flex" flexDirection="column" width="100%">
          {exercise.sets.map((set, i) => (
            <Grid2 container spacing={1} columns={11} key={i}>
              <Grid2 size={1}>
                <IconButton
                  disableRipple
                  sx={{
                    p: 0,
                    m: 0,
                    mt: screenSize.isTablet ? 1.1 : 1,
                    height: '100%',
                    display: i === 0 ? undefined : 'none',
                  }}
                  onClick={() => {
                    setExpandedSetsView(!expandedSetsView);
                  }}
                >
                  <Circle
                    sx={{
                      color: 'white !important',
                      fontSize: screenSize.isTablet ? 14 : 16,
                      ml: screenSize.isUltraSmall
                        ? 0
                        : screenSize.isMobile
                          ? 1
                          : 0,
                    }}
                  />
                </IconButton>
              </Grid2>
              <Grid2 size={10}>
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="center"
                  alignItems="center"
                  gap={1}
                >
                  {exercise.params.map((param) => {
                    let option, setTypeIndex;
                    if (param.defaultValue === 'set') {
                      option = SET;
                      setTypeIndex = 0; //for SET_OPTIONS
                    } else if (param.defaultValue === 'rep') {
                      option = SET_TYPE;
                      setTypeIndex = 0; //for REP_OPTIONS
                    } else if (param.defaultValue === 'eff') {
                      option = TEMPO;
                      setTypeIndex = 1; //for TEMPO_OPTIONS
                    } else if (param.defaultValue === 'time') {
                      option = SET_TYPE;
                      setTypeIndex = 2; //for TIME_OPTIONS
                    } else {
                      //If you come here, then handle the selected param in a new else if
                      throw new Error(
                        `Unhandled param selected value "${param.defaultValue}"`
                      );
                    }

                    if (option === SET) {
                      return (
                        <Box
                          key={param.field}
                          flexBasis={
                            (100 / exercise.sets.length).toString() + '%'
                          }
                        >
                          <SetExerciseAttribute
                            options={option}
                            state={(() => {
                              return {
                                type: 'number',
                                label: 'set',
                                values: option[setTypeIndex].values,
                                option: 'set', //idk what this is??
                                format: option[setTypeIndex].format,
                                value: (i + 1).toString(),
                              };
                            })()}
                            onChange={(state) => {
                              updateParamStatate(param, state, i);
                            }}
                          />
                        </Box>
                      );
                    }

                    const paramValueIndex = set.paramValues.findIndex(
                      (p) => p.field === param.field
                    );
                    const paramValue = set.paramValues[paramValueIndex];
                    let isNumeric =
                      paramValue.value.match(/^\d+(\.\d+)?$/) !== null;

                    return (
                      <Box
                        key={paramValue.field}
                        flexBasis={
                          (100 / exercise.sets.length).toString() + '%'
                        }
                      >
                        <SetExerciseAttribute
                          options={option}
                          state={(() => {
                            return {
                              type: isNumeric ? 'number' : 'select',
                              label:
                                paramValue.selected[0].toUpperCase() +
                                paramValue.selected.slice(1),
                              values: option[setTypeIndex].values,
                              option: 'set', //idk what this is??
                              format: option[setTypeIndex].format,
                              value: paramValue.value.toString(),
                            };
                          })()}
                          onChange={(state) => {
                            updateParamStatate(paramValue, state, i);
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Grid2>
            </Grid2>
          ))}
        </Box>
      )}
    </Stack>
  );
}
