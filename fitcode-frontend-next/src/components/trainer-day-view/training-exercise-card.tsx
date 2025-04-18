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
import { useState } from 'react';
import { SetExerciseAttribute } from './exercise-card-set-attribute';
import { TrainingExerciseCardProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Circle } from '@mui/icons-material';
import { IsNan } from '@tensorflow/tfjs';
import { ExerciseParamOptions } from './exercise-params-option';
import { ComponentParam } from '@/controller/component/type/component.type';

// naredi posebej komponent za option (v02, int, rec)
// naredi posebej komponent za vsak set data (enojni select, number, string)

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const {
    exercise,
    supersetIndex: j,
    selectedExercise,
    setSelectedExercise,
    chartView,
    superior,
    setOpenVideoPlayerModal,
  } = props;

  const { setDetectedChanges } = useGroup();
  const {
    training,
    setTraining,
    component,
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
          {Array.from({ length: /* exercise.meta.set */ 3 }, (_, i) => (
            <Grid2 container spacing={1} columns={11}>
              <Grid2 size={0.5}>
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
              {/* Sets */}
              <Grid2 size={2}>
                <SetExerciseAttribute
                  options={SET}
                  state={(() => {
                    return {
                      type: 'number',
                      label: 'set',
                      values: SET[0].values,
                      option: 'set',
                      format: SET[0].format,
                      value: (i + 1).toString(),
                    };
                  })()}
                  onChange={(state) => {}}
                />
              </Grid2>

              {/* Set Type */}
              <Grid2 size={2}>
                <SetExerciseAttribute
                  options={SET_TYPE}
                  state={(() => {
                    /* const option = SET_TYPE.find(
                      (option) => option.label === state.setType
                    )!;

                    if (!option) */
                    return {
                      type: 'select',
                      label: 'test',
                      values: ['test1', 'test2'],
                      option: 'Test',
                      format: (value) => value,
                      value: '',
                    };

                    /* return {
                      type: option.type,
                      label: option.label,
                      values: option.values,
                      option: option.label as string,
                      format: option.format,
                      value:
                        // state.setTypeValue.toString() ??
                        option.values![1].toString(),
                    }; */
                  })()}
                  onChange={(state) => {
                    const setType =
                      state.option; /*  as ExerciseMeta['setType']; */
                    const setTypeValue = parseInt(state.value);

                    updateSelectedTraining([
                      { field: 'setType', value: setType },
                      {
                        field: 'setTypeValue',
                        value: isNaN(setTypeValue) ? 5 : setTypeValue,
                      }, // 5 because all set type options include 5
                    ]);
                  }}
                />
              </Grid2>

              {/* Workload */}
              <Grid2 size={2}>
                <SetExerciseAttribute
                  options={WORKLOAD}
                  state={(() => {
                    /* const option = WORKLOAD.find(
                      (option) => option.label === state.workloadType
                    )!; */

                    return {
                      type: 'select',
                      label: 'test',
                      values: ['test1', 'test2'],
                      option: 'Test',
                      format: (v) => v,
                      value: '10',
                    };
                  })()}
                  onChange={(state) => {
                    const workloadType =
                      state.option; /* as ExerciseMeta['workloadType']; */

                    // if workload value not in values array, select first value in array
                    let workloadValue = parseInt(state.value);
                    if (
                      state.type === 'select' &&
                      !state.values!.includes(workloadValue.toString())
                    ) {
                      workloadValue = parseInt(state.values![1]);
                    }

                    updateSelectedTraining([
                      { field: 'workloadType', value: workloadType },
                      { field: 'workloadValue', value: workloadValue },
                    ]);
                  }}
                />
              </Grid2>

              {/* Tempo */}
              <Grid2 size={2}>
                <SetExerciseAttribute
                  options={TEMPO}
                  state={(() => {
                    /* 
                    const option = TEMPO.find(
                      (option) => option.label === tempoOrEffort
                    )!; */

                    return {
                      type: 'select',
                      label: 'test',
                      values: ['test1', 'test2'],
                      option: 'Test',
                      format: (v) => v,
                      value: '',
                    };
                  })()}
                  onChange={(state) => {
                    updateSelectedTraining([
                      {
                        // field: tempoOrEffort === 'temp' ? 'tempo' : 'effort',
                        field: 'temp',
                        value: state.value,
                      },
                    ]);
                  }}
                />
              </Grid2>

              {/* Recovery */}
              <Grid2 size={2}>
                <SetExerciseAttribute
                  options={RECOVERY}
                  state={(() => {
                    const option = RECOVERY.find(
                      (option) => option.label === 'rec'
                    )!;
                    return {
                      type: option.type,
                      label: option.label,
                      values: option.values,
                      option: option.label as string,
                      format: option.format,
                      value: /* state.rec ? state.rec.toString() : */ '',
                    };
                  })()}
                  onChange={(state) => {
                    const rec = parseInt(state.value);
                    updateSelectedTraining([{ field: 'rec', value: rec }]);
                  }}
                />
              </Grid2>
            </Grid2>
          ))}
        </Box>
      )}
    </Stack>
  );
}
