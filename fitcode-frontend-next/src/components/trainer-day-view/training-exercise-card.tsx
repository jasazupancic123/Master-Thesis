import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { Box, Collapse, Grid2, IconButton, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useEffect, useState } from 'react';
import { TrainingExerciseCardProps } from './props';
import { useScreenSize } from '@/context/screen-size-provider';
import { Circle, Info } from '@mui/icons-material';
import { ExerciseParam } from './exercise-card/exercise-param';
import {
  ExerciseSet,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { useGroup } from '@/context/group-provider';
import ReactDOM from 'react-dom';
import { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { IntensityVolumeValues } from '@/controller/training/type/intensity-volume-values.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Training } from '@/controller/training/type/training.type';
import { TrainingService } from '@/controller/training/training.service';
import LeftRightExerciseText from './exercise-card/left-right-exercise-text';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import toast from 'react-hot-toast';
import { set } from 'date-fns';
import { Workload } from '@/controller/training/type/workload.type';

export default function TrainingExerciseCard(props: TrainingExerciseCardProps) {
  const screenSize = useScreenSize();
  const {
    supersetIndex,
    selectedExercise,
    setSelectedExercise,
    chartView,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
    exercise: propsExercise,
  } = props;

  const [exercise, setExercise] = useState(propsExercise);
  const [expandedSetsView, setExpandedSetsView] = useState(false);
  const [setsNumber, setSetsNumber] = useState(props.exercise.sets.length);
  const {
    training,
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setComponent,
    setTraining,
    selectedAthlete,
    selectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    isSettingAthleteWorkloads,
    previousSelectedAthlete,
  } = useTrainerDayViewContext();

  const { filteredTrainings, setFilteredTrainings, setDetectedChanges } =
    useGroup();

  const i = training?.components.findIndex((c) => c.id === component?.id);
  const selectedTrainingOrSubgroup =
    selectedSubgroup?.subgroup || training?.components?.[i!];
  const k = selectedTrainingOrSubgroup?.supersets?.[
    supersetIndex!
  ]?.exercises?.findIndex((e) => e.id === exercise.id);

  const currentExercise =
    selectedTrainingOrSubgroup?.supersets?.[supersetIndex!]?.exercises?.[k!];

  const params =
    currentExercise?.sets?.[0]?.paramValuesL
      ?.map((pv) => exercise?.params?.find((p) => p.field === pv.field)!)
      ?.filter((p) => p) || [];

  if (!training || !component || !params) return null;

  useEffect(() => {
    if (propsExercise !== exercise) {
      setSetsNumber(propsExercise.sets.length);
      setExercise(propsExercise);
    }
  }, [propsExercise]);

  useEffect(() => {
    const newSets = setsNumber;
    if (newSets > 16 || newSets < 1) return;

    const prevSets = exercise.sets.length;

    let newExercise;
    if (prevSets > newSets) {
      // remove sets
      newExercise = {
        ...exercise,
        sets: [...exercise.sets].slice(0, newSets),
        params: [...exercise.params],
      };
    } else {
      // add sets to the end
      const paramValues = exercise.sets[
        exercise.sets.length - 1
      ].paramValuesL.map((pv) => ({ ...pv }));

      newExercise = {
        ...exercise,
        sets: [
          ...exercise.sets,
          ...Array.from({ length: newSets - prevSets }, (_, i) => ({
            setNumber: prevSets + i + 1,
            paramValuesL: paramValues,
            paramValuesR: paramValues,
          })),
        ],
      };
    }

    updateTraining(newExercise);
  }, [setsNumber]);

  function updateTraining(
    exercise: TrainingExercise,
    intensityVolumeValue?: IntensityVolumeValues
  ) {
    if (!training || !component) return;

    const newSuperset = { ...supersets[supersetIndex] };
    const exerciseIndex = newSuperset.exercises.findIndex(
      (e) => e.id === exercise.id
    );

    if (exerciseIndex === -1 || !training || !component) return;

    newSuperset.exercises[exerciseIndex] = { ...exercise };
    const newSupersets = [...supersets];
    if (supersetIndex !== -1) newSupersets[supersetIndex] = newSuperset;

    ReactDOM.unstable_batchedUpdates(() => {
      setSupersetsWithAdd(newSupersets);

      if (selectedSubgroup?.subgroup) {
        // set new avg future workload values
        let newAvgFutureWorkloadValues = undefined;
        if (intensityVolumeValue) {
          newAvgFutureWorkloadValues = [
            ...selectedSubgroup.subgroup.avgFutureWorkloadValues,
          ];
          const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
            (aw) => aw.exerciseId === exercise.id
          );
          if (!foundAvgWorkloadValue) {
            newAvgFutureWorkloadValues.push({
              exerciseId: exercise.id,
              rootComponentId: component.component?.id || '',
              numMembers: selectedSubgroup.subgroup.membersIds.length,
              avgWorkloadValue: intensityVolumeValue!,
            });
          } else {
            foundAvgWorkloadValue.numMembers =
              selectedSubgroup.subgroup.membersIds.length;
            foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
          }
        }

        const updatedSubgroup = newAvgFutureWorkloadValues
          ? {
              ...selectedSubgroup.subgroup,
              supersets: newSupersets,
              avgFutureWorkloadValues: newAvgFutureWorkloadValues,
            }
          : {
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

        // set new avg future workload values
        let newAvgFutureWorkloadValues = undefined;
        if (intensityVolumeValue) {
          newAvgFutureWorkloadValues = [...training.avgFutureWorkloadValues];
          const foundAvgWorkloadValue = newAvgFutureWorkloadValues.find(
            (aw) => aw.exerciseId === exercise.id
          );

          // get number of members in main group
          const subgroupsMembersIds = updatedComponent.subgroups.reduce(
            (acc, subgroup) => {
              return [...acc, ...subgroup.membersIds];
            },
            [] as string[]
          );
          const numberOfMainGroupMembers =
            training.membersIds.length - subgroupsMembersIds.length;

          if (!foundAvgWorkloadValue) {
            newAvgFutureWorkloadValues.push({
              exerciseId: exercise.id,
              rootComponentId: component.component?.id || '',
              numMembers: numberOfMainGroupMembers,
              avgWorkloadValue: intensityVolumeValue!,
            });
          } else {
            foundAvgWorkloadValue.numMembers = numberOfMainGroupMembers;
            foundAvgWorkloadValue.avgWorkloadValue = intensityVolumeValue!;
          }
        }

        const newTraining = newAvgFutureWorkloadValues
          ? {
              ...training,
              components: updatedComponents,
              avgFutureWorkloadValues: newAvgFutureWorkloadValues,
            }
          : { ...training, components: updatedComponents };
        setTraining(newTraining);

        const updatedTrainings = filteredTrainings.map((filteredTraining) => {
          if (filteredTraining.id === training.id) {
            return newTraining;
          }
          return filteredTraining;
        });

        setFilteredTrainings(updatedTrainings);
      }

      setDetectedChanges(true);
    });
  }

  const getPerscribedFieldName = (param: Attribute, leftOrRight: 'L' | 'R') => {
    let perscribedFieldName;
    switch (param.field) {
      case 'int1':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntWork1ValueL'
            : 'prescribedIntWork1ValueR';
        break;
      case 'int2':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntWork2ValueL'
            : 'prescribedIntWork2ValueR';
        break;
      case 'vol1':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolWork1ValueL'
            : 'prescribedVolWork1ValueR';
        break;
      case 'vol2':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolWork2ValueL'
            : 'prescribedVolWork2ValueR';
        break;
      case 'intRec':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedIntRecValueL'
            : 'prescribedIntRecValueR';
        break;
      case 'volRec':
        perscribedFieldName =
          leftOrRight === 'L'
            ? 'prescribedVolRecValueL'
            : 'prescribedVolRecValueR';
        break;
      default:
        break;
    }

    return perscribedFieldName;
  };

  const handleAthleteWorkloadsChange = (
    exercise: TrainingExercise,
    setNumber: number,
    param: Attribute,
    newValue: string,
    leftOrRight: 'L' | 'R',
    updateAllSets: boolean = false
  ) => {
    if (!selectedAthlete) return;

    if (updateAllSets) {
      // the first set has been updated on non expanded view, update all sets
      let foundFutureWorkloads =
        selectedAthleteWorkloads.futureWorkloads.filter(
          (fw) =>
            fw.trainingId === training.id &&
            fw.exerciseId === exercise.id &&
            fw.userId === selectedAthlete.uid
        );

      if (!foundFutureWorkloads.length) {
        toast.error("Save the training to update athlete's workloads", {
          icon: '⚠️',
          duration: 3000,
        });
        return;
      }

      const perscribedFieldName = getPerscribedFieldName(param, leftOrRight);
      if (!perscribedFieldName) {
        toast.error(`Invalid parameter field: ${param.field}`);
        return;
      }

      const foundAlreadyCustomWorkloads = customAthleteWorkloads.filter(
        (cw) =>
          cw.trainingId === training.id &&
          cw.exerciseId === exercise.id &&
          cw.userId === selectedAthlete.uid
      );

      const newCustomAthleteWorkloads = [] as Workload[];
      if (foundAlreadyCustomWorkloads.length) {
        foundFutureWorkloads = foundFutureWorkloads.filter(
          (fw) =>
            !foundAlreadyCustomWorkloads.some(
              (cw) =>
                cw.trainingId === fw.trainingId &&
                cw.exerciseId === fw.exerciseId &&
                cw.setNumber === fw.setNumber &&
                cw.userId === fw.userId
            )
        );

        for (const w of foundAlreadyCustomWorkloads) {
          const newCustomWorkload = {
            ...w,
            [perscribedFieldName]: newValue,
          };
          newCustomAthleteWorkloads.push(newCustomWorkload);
        }
      }

      for (const w of foundFutureWorkloads) {
        const newCustomWorkload = {
          ...w,
          [perscribedFieldName]: newValue,
        };
        newCustomAthleteWorkloads.push(newCustomWorkload);
      }

      setCustomAthleteWorkloads(newCustomAthleteWorkloads);
    } else {
      const foundFutureWorkload = selectedAthleteWorkloads.futureWorkloads.find(
        (fw) =>
          fw.trainingId === training.id &&
          fw.exerciseId === exercise.id &&
          fw.setNumber === setNumber &&
          fw.userId === selectedAthlete.uid
      );

      if (!foundFutureWorkload) {
        toast.error("Save the training to update athlete's workloads", {
          icon: '⚠️',
          duration: 3000,
        });
        return;
      }

      const perscribedFieldName = getPerscribedFieldName(param, leftOrRight);
      if (!perscribedFieldName) {
        toast.error(`Invalid parameter field: ${param.field}`);
        return;
      }

      const foundAlreadyCustomWorkload = customAthleteWorkloads.find(
        (cw) =>
          cw.trainingId === training.id &&
          cw.exerciseId === exercise.id &&
          cw.setNumber === setNumber &&
          cw.userId === selectedAthlete.uid
      );

      if (foundAlreadyCustomWorkload) {
        // if the workload is already custom, update it
        const newCustomWorkload = {
          ...foundAlreadyCustomWorkload,
          [perscribedFieldName]: newValue,
        };
        setCustomAthleteWorkloads((prev) =>
          prev.map((cw) =>
            cw.trainingId === newCustomWorkload.trainingId &&
            cw.exerciseId === newCustomWorkload.exerciseId &&
            cw.setNumber === newCustomWorkload.setNumber &&
            cw.userId === selectedAthlete.uid
              ? newCustomWorkload
              : cw
          )
        );
      } else {
        // if the workload is not already custom, create a new one
        const newFutureWorkload = {
          ...foundFutureWorkload,
          [perscribedFieldName]: newValue,
        };
        setCustomAthleteWorkloads((prev) => [...prev, newFutureWorkload]);
      }
    }
  };

  const getLAndRValues = (
    set: ExerciseSet,
    param: Attribute,
    setIndex: number,
    paramIndex: number
  ) => {
    let valueL, valueR;

    // find the custom workload for the selected athlete
    const foundCustomFutureWorkload = customAthleteWorkloads.find(
      (cw) =>
        cw.trainingId === training.id &&
        cw.exerciseId === exercise.id &&
        cw.setNumber === set.setNumber &&
        cw.userId === selectedAthlete?.uid
    );
    //  ||
    // customAthleteWorkloads.find(
    //   (cw) =>
    //     cw.trainingId === training.id &&
    //     cw.exerciseId === exercise.id &&
    //     cw.setNumber === set.setNumber &&
    //     cw.userId === previousSelectedAthlete.current?.uid
    // );

    // find the future workload for the selected athlete, not yet custom/modified
    const foundFutureWorkload = selectedAthleteWorkloads.futureWorkloads.find(
      (fw) =>
        fw.trainingId === training.id &&
        fw.exerciseId === exercise.id &&
        fw.setNumber === set.setNumber &&
        fw.userId === selectedAthlete?.uid
    );
    //  ||
    // selectedAthleteWorkloads.futureWorkloads.find(
    //   (fw) =>
    //     fw.trainingId === training.id &&
    //     fw.exerciseId === exercise.id &&
    //     fw.setNumber === set.setNumber &&
    //     fw.userId === previousSelectedAthlete.current?.uid
    // );

    if (
      (foundCustomFutureWorkload || foundFutureWorkload) &&
      param.field !== 'volWorkSets'
    ) {
      const perscribedFieldNameL = getPerscribedFieldName(param, 'L');
      const perscribedFieldNameR = getPerscribedFieldName(param, 'R');

      if (!perscribedFieldNameL || !perscribedFieldNameR) {
        toast.error(`Invalid parameter field: ${param.field}`);
        return { valueL: null, valueR: null };
      }

      const selected =
        exercise.sets[setIndex].paramValuesL[paramIndex].selected;

      valueL = {
        field: param.field,
        selected: selected,
        value: ((foundCustomFutureWorkload || foundFutureWorkload) as any)[
          perscribedFieldNameL
        ].toString(),
      };

      valueR = {
        field: param.field,
        selected: selected,
        value: ((foundCustomFutureWorkload || foundFutureWorkload) as any)[
          perscribedFieldNameR
        ].toString(),
      };
    } else {
      valueL = exercise.sets[setIndex].paramValuesL.find(
        (pv) => pv.field === param.field
      ) || {
        field: param.field,
        selected: 'set',
        value: exercise.sets.length.toString(),
      };

      valueR = exercise.sets[setIndex].paramValuesR.find(
        (pv) => pv.field === param.field
      ) || {
        field: param.field,
        selected: 'set',
        value: exercise.sets.length.toString(),
      };
    }

    return { valueL, valueR };
  };

  return (
    <Stack
      spacing={1}
      p={1}
      px={screenSize.isMobile ? 0 : undefined}
      pb={2}
      sx={{
        width: '100% !important',
        position: 'relative',
        backgroundColor: chartView
          ? 'transparent'
          : exercise.exercise?.imageUrl
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.05)',
        backgroundImage:
          exercise.exercise?.imageUrl && !expandedSetsView
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

      {chartView ? (
        <></>
      ) : !expandedSetsView ? (
        <Grid2
          container
          spacing={1}
          columns={11}
          key={i}
          px={screenSize.isSmallerThanLaptop ? 1 : 0}
        >
          <Grid2 size={1}>
            <IconButton
              disableRipple
              sx={{
                p: 0,
                m: 0,
                // mt: 1.66,
                pb: 3.66,
                height: '100%',
              }}
              onClick={() => setExpandedSetsView(!expandedSetsView)}
            >
              {/* <Circle
                sx={{
                  display:
                    selectedExercise?.id === exercise.id ? 'none' : undefined,
                  color: 'white !important',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                }}
              /> */}
                <KeyboardArrowRightIcon
                sx={{
                  transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(0deg)',
                  color: 'white',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out',
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
              <Box
                display="flex"
                flexDirection="column"
                gap={1}
                justifyContent="end"
                height={80}
              >
                <LeftRightExerciseText title="L" />
                <LeftRightExerciseText title="R" />
              </Box>
              {exercise.params.map((param, i) => {
                /* find the custom workload for the selected athlete if selected, otherwise
                get the value from the exercise sets */
                const { valueL, valueR } = getLAndRValues(
                  exercise.sets[0],
                  param,
                  0,
                  i - 1
                );

                if (!valueL || !valueR) {
                  toast.error(`Invalid parameter field: ${param.field}`);
                  return null;
                }

                return (
                  <>
                    <Box
                      key={param.field}
                      flexBasis={
                        (100 / exercise.params.length).toString() + '%'
                      }
                    >
                      <ExerciseParam
                        param={param}
                        value={
                          param.field === 'volWorkSets'
                            ? ({
                                field: valueL.field,
                                selected: valueL.selected,
                                value: setsNumber.toString(),
                              } as AttributeValue)
                            : valueL
                        }
                        exercise={exercise}
                        setsNumber={setsNumber}
                        setSetsNumber={setSetsNumber}
                        onOptionChange={(newValue) => {
                          const paramIndex =
                            exercise.sets[0].paramValuesL.findIndex(
                              (pv) => pv.field === param.field
                            );

                          const newExercise = { ...exercise };
                          newExercise.sets.forEach(({ paramValuesL }) => {
                            if (paramValuesL[paramIndex])
                              paramValuesL[paramIndex].selected =
                                newValue as string;
                          });

                          setExercise(newExercise);
                        }}
                        onSubOptionChange={(newValue) => {
                          if (+newValue < 0) return;

                          if (param.field === 'volWorkSets') {
                            setSetsNumber(+newValue);
                            return;
                          }

                          // update only selected athletes workloads
                          if (selectedAthlete) {
                            handleAthleteWorkloadsChange(
                              exercise,
                              1,
                              param,
                              newValue as string,
                              'L',
                              true
                            );
                            return;
                          }

                          const paramIndex =
                            exercise.sets[0].paramValuesL.findIndex(
                              (pv) => pv.field === param.field
                            );

                          const newExercise = { ...exercise };
                          const updatedSets: ExerciseSet[] =
                            newExercise.sets.map((set) => {
                              return {
                                setNumber: set.setNumber,
                                paramValuesR: set.paramValuesR,
                                paramValuesL: [...set.paramValuesL].map(
                                  (param, index) => {
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
                                  }
                                ),
                              };
                            });

                          const intensityVolumeValue =
                            TrainingService.getIntensityVolumeValues(
                              updatedSets
                            );

                          newExercise.sets = [...updatedSets];
                          updateTraining(newExercise, intensityVolumeValue);
                        }}
                      />
                      <ExerciseParam
                        param={param}
                        showOptions={false}
                        value={
                          param.field === 'volWorkSets'
                            ? ({
                                field: valueR.field,
                                selected: valueR.selected,
                                value: setsNumber.toString(),
                              } as AttributeValue)
                            : valueR
                        }
                        exercise={exercise}
                        setsNumber={setsNumber}
                        setSetsNumber={setSetsNumber}
                        onOptionChange={(newValue) => {
                          const paramIndex =
                            exercise.sets[0].paramValuesR.findIndex(
                              (pv) => pv.field === param.field
                            );

                          const newExercise = { ...exercise };
                          newExercise.sets.forEach(({ paramValuesR }) => {
                            if (paramValuesR[paramIndex])
                              paramValuesR[paramIndex].selected =
                                newValue as string;
                          });

                          setExercise(newExercise);
                        }}
                        onSubOptionChange={(newValue) => {
                          if (+newValue < 0) return;

                          if (param.field === 'volWorkSets') {
                            setSetsNumber(+newValue);
                            return;
                          }

                          // update only selected athletes workloads
                          if (selectedAthlete) {
                            handleAthleteWorkloadsChange(
                              exercise,
                              1,
                              param,
                              newValue as string,
                              'R',
                              true
                            );
                            return;
                          }

                          const paramIndex =
                            exercise.sets[0].paramValuesR.findIndex(
                              (pv) => pv.field === param.field
                            );

                          const newExercise = { ...exercise };
                          const updatedSets: ExerciseSet[] =
                            newExercise.sets.map((set) => {
                              return {
                                setNumber: set.setNumber,
                                paramValuesL: set.paramValuesL,
                                paramValuesR: [...set.paramValuesR].map(
                                  (param, index) => {
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
                                  }
                                ),
                              };
                            });

                          const intensityVolumeValue =
                            TrainingService.getIntensityVolumeValues(
                              updatedSets
                            );

                          newExercise.sets = [...updatedSets];
                          updateTraining(newExercise, intensityVolumeValue);
                        }}
                      />
                    </Box>
                  </>
                );
              })}
            </Box>
          </Grid2>
        </Grid2>
      ) : (
        <Box display="flex" flexDirection="column" width="100%" gap={1}>
          {exercise.sets.map((set, i) => {
            return (
              <Grid2
                container
                spacing={1}
                columns={11}
                key={i}
                px={screenSize.isSmallerThanLaptop ? 1 : 0}
              >
                <Grid2 size={1}>
                  <IconButton
                    disableRipple
                    sx={{
                      p: 0,
                      m: 0,
                      // mt: 1.66,
                      pb: 3.66,
                      height: '100%',
                      display: i === 0 ? undefined : 'none',
                    }}
                    onClick={() => {
                      setExpandedSetsView(!expandedSetsView);
                    }}
                  >
                    <KeyboardArrowRightIcon
                sx={{
                  transform: expandedSetsView ? 'rotate(90deg)' : 'rotate(0deg)',
                  color: 'white',
                  fontSize: screenSize.isTablet ? 14 : 16,
                  ml: screenSize.isUltraSmall ? 0 : screenSize.isMobile ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out',
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
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={1}
                      justifyContent="end"
                      height={set.setNumber === 1 ? 80 : 55}
                    >
                      <LeftRightExerciseText title="L" />
                      <LeftRightExerciseText title="R" />
                    </Box>
                    {exercise.params.map((param, j) => {
                      /* find the custom workload for the selected athlete if selected, otherwise
                      get the value from the exercise sets */
                      const { valueL, valueR } = getLAndRValues(
                        set,
                        param,
                        i,
                        j - 1
                      );

                      if (!valueL || !valueR) {
                        toast.error(`Invalid parameter field: ${param.field}`);
                        return null;
                      }

                      return (
                        <Box
                          key={param.field}
                          flexBasis={
                            (100 / exercise.params.length).toString() + '%'
                          }
                        >
                          <ExerciseParam
                            showOptions={set.setNumber === 1}
                            disableOptions
                            disableSets
                            param={param}
                            value={valueL}
                            onOptionChange={(newValue) => {}}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              // update only selected athletes workloads
                              if (selectedAthlete) {
                                handleAthleteWorkloadsChange(
                                  exercise,
                                  set.setNumber,
                                  param,
                                  newValue as string,
                                  'L'
                                );
                                return;
                              }

                              const paramIndex = exercise.sets[
                                i
                              ].paramValuesL.findIndex(
                                (pv) => pv.field === param.field
                              );

                              const newExercise = { ...exercise };

                              const setIndex = newExercise.sets.findIndex(
                                (s) => s.setNumber === set.setNumber
                              );

                              const updatedSets: ExerciseSet[] =
                                newExercise.sets.map((set, k) => {
                                  return {
                                    setNumber: set.setNumber,
                                    paramValuesR: set.paramValuesR,
                                    paramValuesL: [...set.paramValuesL].map(
                                      (param, index) => {
                                        if (
                                          index === paramIndex &&
                                          setIndex === k
                                        ) {
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
                                      }
                                    ),
                                  };
                                });

                              const intensityVolumeValue =
                                TrainingService.getIntensityVolumeValues(
                                  updatedSets
                                );

                              newExercise.sets = [...updatedSets];
                              updateTraining(newExercise, intensityVolumeValue);
                            }}
                          />

                          <ExerciseParam
                            showOptions={false}
                            disableOptions
                            disableSets
                            param={param}
                            value={valueR}
                            onOptionChange={(newValue) => {}}
                            onSubOptionChange={(newValue) => {
                              if (+newValue < 0) return;

                              // update only selected athletes workloads
                              if (selectedAthlete) {
                                handleAthleteWorkloadsChange(
                                  exercise,
                                  set.setNumber,
                                  param,
                                  newValue as string,
                                  'R'
                                );
                                return;
                              }

                              const paramIndex = exercise.sets[
                                i
                              ].paramValuesR.findIndex(
                                (pv) => pv.field === param.field
                              );

                              const newExercise = { ...exercise };
                              const setIndex = newExercise.sets.findIndex(
                                (s) => s.setNumber === set.setNumber
                              );

                              const updatedSets: ExerciseSet[] =
                                newExercise.sets.map((set, k) => {
                                  return {
                                    setNumber: set.setNumber,
                                    paramValuesL: set.paramValuesL,
                                    paramValuesR: [...set.paramValuesR].map(
                                      (param, index) => {
                                        if (
                                          index === paramIndex &&
                                          setIndex === k
                                        ) {
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
                                      }
                                    ),
                                  };
                                });

                              const intensityVolumeValue =
                                TrainingService.getIntensityVolumeValues(
                                  updatedSets
                                );

                              newExercise.sets = [...updatedSets];
                              updateTraining(newExercise, intensityVolumeValue);
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Grid2>
              </Grid2>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
