import { TrainingComponent } from '@/training/entity/training-component.entity';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { SetType } from '@/training/enum/set-type.enum';
import { DISTANCE_OPTIONS, REP_OPTIONS, TIME_OPTIONS, VO2_OPTIONS } from '@/common/constant/training-exercise.constant';
import toast from 'react-hot-toast';
import { TrainingController } from '@/training/training.controller';
import { useAppContext } from '@/context/app-provider';

interface Props {
  trainingId: string;
  component: TrainingComponent;
}

export default function AthleteTrainingExerciseCard(props: Props) {
  const { token } = useAppContext();
  const { component, trainingId } = props;

  // State to manage input values for each set
  const [setValues, setSetValues] = React.useState<
    Record<string, Array<{ setValue: string; workloadValue: string }>>
  >({});

  const handleSetValueChange = (
    exerciseId: string,
    setIndex: number,
    value: string,
    type: 'setValue' | 'workloadValue',
  ) => {
    setSetValues((prev) => {
      const updatedValues = { ...prev };
      if (!updatedValues[exerciseId]) {
        updatedValues[exerciseId] = Array(
          component.supersets
            .flatMap((superset) => superset.exercises)
            .find((exercise) => exercise.exerciseId === exerciseId)?.meta.sets || 0,
        ).fill({ setValue: '', workloadValue: '' });
      }

      updatedValues[exerciseId][setIndex] = {
        ...updatedValues[exerciseId][setIndex],
        [type]: value,
      };
      return updatedValues;
    });
  };

  async function handleSaveSets(
    componentId: string,
    supersetId: string,
    exerciseId: string,
  ) {
    const values = setValues[exerciseId] || [];

    try {
      await TrainingController.updateAthleteSetData(
        token,
        trainingId,
        componentId,
        supersetId,
        exerciseId,
        values.map((val, i) => ({
          setNumber: i + 1,
          setTypeValue: +val.setValue,
          workloadValue: val.workloadValue,
        })),
      );

      toast.success('Successfully updated sets!');
    } catch (e: any) {
      console.error(e);
      toast.error(`Something went wrong: ${e.message}`);
    }
  }

  // Helper function to get options based on set type and workload type
  function getOptions(exercise: TrainingExercise) {
    switch (exercise.meta.setType) {
      case SetType.REPS:
        return REP_OPTIONS;
      case SetType.DISTANCE:
        return DISTANCE_OPTIONS;
      case SetType.TIME:
        return TIME_OPTIONS;
      case SetType.VO2:
        return VO2_OPTIONS;
      default:
        return REP_OPTIONS;
    }
  }

  // Set initial values based on trainer's exercise meta
  useEffect(() => {
    const initialSetValues: Record<
      string,
      Array<{ setValue: string; workloadValue: string }>
    > = {};

    component.supersets.forEach((superset) => {
      superset.exercises.forEach((exercise) => {
        initialSetValues[exercise.exerciseId] = Array.from(
          { length: exercise.meta.sets },
          () => ({
            setValue: exercise.meta.setTypeValue.toString(),
            workloadValue: exercise.meta.workloadValue.toString(),
          }),
        );
      });
    });

    setSetValues(initialSetValues);
  }, [component]);

  return (
    <Grid2 container spacing={3}>
      <Grid2 xs={12} key={component.componentId}>
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            position: 'relative',
            overflow: 'visible',
            mt: 2,
          }}
        >
          {/* Component ID Label - Floating */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              position: 'absolute',
              color: 'primary.main',
              top: -16,
              left: 0,
              backgroundColor: '#263646',
              px: 2,
              py: 1,
              borderRadius: 2,
              zIndex: 1,
            }}
          >
            {component.componentId}
          </Typography>

          <CardContent>
            {component.supersets
              .sort((a, b) => a.order - b.order)
              .map((superset) => (
                <Grid2 xs={12} key={superset.id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      borderLeft: `4px solid ${superset.color}`,
                      mb: 2,
                    }}
                  >
                    <CardContent sx={{ fontWeight: 'bold', mb: 0 }}>
                      {superset.exercises.map((exercise) => {
                        const options = getOptions(exercise);

                        return (
                          <Grid2
                            container
                            spacing={2}
                            key={exercise.exerciseId}
                            sx={{ mb: 1 }}
                          >
                            <Grid2 xs={12} sm={4}>
                              <Card sx={{ borderRadius: 2, boxShadow: 0 }}>
                                <CardContent>
                                  <Avatar
                                    sx={{
                                      width: 60,
                                      height: 60,
                                      margin: 'auto',
                                      backgroundColor: exercise.color,
                                    }}
                                  >
                                    <FitnessCenter />
                                  </Avatar>
                                  <Typography
                                    variant="h6"
                                    align="center"
                                    sx={{ marginTop: 1, fontWeight: 'bold' }}
                                  >
                                    {exercise.exercise?.name || 'Unnamed Exercise'}
                                  </Typography>

                                  {/*<Typography
                                    variant="body2"
                                    align="center"
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    Sets: {exercise.meta.sets} | {exercise.meta.setType}:{' '}
                                    {exercise.meta.setTypeValue}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    align="center"
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    Workload: {exercise.meta.workloadValue}{' '}
                                    {exercise.meta.workloadType}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    align="center"
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    Effort: {exercise.meta.effort || 'N/A'}
                                  </Typography>*/}
                                </CardContent>
                              </Card>
                            </Grid2>

                            <Grid2 container xs={12} sm={8} spacing={1}>
                              {Array.from({ length: exercise.meta.sets }).map((_, setIndex) => (
                                <Grid2 container xs={12} key={setIndex} spacing={0}>
                                  <Grid2 xs={12} sm={6}>
                                    {/* Set Type Dropdown (Reps/Distance/Time/VO2) */}
                                    <FormControl fullWidth>
                                      <InputLabel>{options.label[0].toUpperCase() + options.label.slice(1)}</InputLabel>
                                      <Select
                                        value={
                                          setValues[exercise.exerciseId]?.[setIndex]?.setValue || ''
                                        }
                                        onChange={(e) =>
                                          handleSetValueChange(
                                            exercise.exerciseId,
                                            setIndex,
                                            e.target.value as string,
                                            'setValue',
                                          )
                                        }
                                        label={options.label}
                                      >
                                        {options.values?.map((value) => (
                                          <MenuItem key={value} value={value}>
                                            {options.format(value)}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid2>

                                  <Grid2 xs={12} sm={6}>
                                    {/* Workload Value TextField */}
                                    <TextField
                                      fullWidth
                                      label={exercise.meta.workloadType.toUpperCase()}
                                      type="number"
                                      value={
                                        setValues[exercise.exerciseId]?.[setIndex]?.workloadValue || ''
                                      }
                                      onChange={(e) =>
                                        handleSetValueChange(
                                          exercise.exerciseId,
                                          setIndex,
                                          e.target.value,
                                          'workloadValue',
                                        )
                                      }
                                    />
                                  </Grid2>
                                </Grid2>
                              ))}

                              <Grid2 xs={12}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={<FitnessCenter />}
                                  onClick={() => handleSaveSets(
                                    component.componentId,
                                    superset.id,
                                    exercise.exerciseId,
                                  )}
                                  sx={{ mb: 2 }}
                                >
                                  Save Sets
                                </Button>
                              </Grid2>
                            </Grid2>
                          </Grid2>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
}