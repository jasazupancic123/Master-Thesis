import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  DISTANCE_OPTIONS,
  REP_OPTIONS,
  TIME_OPTIONS,
  VO2_OPTIONS,
} from '@/common/constant/training-exercise.constant';
import toast from 'react-hot-toast';
import {
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { SetType } from '@/controller/training/enum/set-type.enum';

interface Props {
  trainingId: string;
  component: TrainingComponent;
}

export default function AthleteTrainingExerciseCard(props: Props) {
  const { component } = props;

  // State to manage input values for each set
  const [setValues, setSetValues] = React.useState<
    Record<string, Array<{ setValue: string; workloadValue: string }>>
  >({});

  const handleSetValueChange = (
    exerciseId: string,
    setIndex: number,
    value: string,
    type: 'setValue' | 'workloadValue'
  ) => {
    setSetValues((prev) => {
      const updatedValues = { ...prev };
      if (!updatedValues[exerciseId]) {
        updatedValues[exerciseId] = Array(
          component.supersets
            .flatMap((superset) => Object.values(superset.exercises))
            .find((exercise) => exercise.id === exerciseId)?.meta.sets || 0
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
    superset: number,
    exerciseId: string
  ) {
    const values = setValues[exerciseId] || [];

    try {
      /* await TrainingController.updateAthleteSetData(
        token,
        trainingId,
        componentId,
        supersetId,
        exerciseId,
        values.map((val, i) => ({
          setNumber: i + 1,
          setTypeValue: +val.setValue,
          workloadValue: val.workloadValue,
        }))
      ); */

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
      Object.values(superset.exercises).forEach((exercise) => {
        initialSetValues[exercise.id] = Array.from(
          { length: exercise.meta.sets },
          () => ({
            setValue: exercise.meta.setTypeValue.toString(),
            workloadValue: exercise.meta.workloadValue.toString(),
          })
        );
      });
    });

    setSetValues(initialSetValues);
  }, [component]);

  return (
    <Grid2 container spacing={3}>
      <Grid2 size={{ xs: 12 }} key={component.id}>
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
            {component.id}
          </Typography>

          <CardContent>
            {component.supersets
              .sort((a, b) => a.order - b.order)
              .map((superset) => (
                <Grid2 size={{ xs: 12 }} key={superset.order}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      borderLeft: `4px solid ${superset.color}`,
                      mb: 2,
                    }}
                  >
                    <CardContent sx={{ fontWeight: 'bold', mb: 0 }}>
                      {Object.values(superset.exercises).map((exercise) => {
                        const options = getOptions(exercise);

                        return (
                          <Grid2
                            container
                            spacing={2}
                            key={exercise.id}
                            sx={{ mb: 1 }}
                          >
                            <Grid2 size={{ xs: 12, sm: 4 }}>
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
                                    {exercise.exercise?.name ||
                                      'Unnamed Exercise'}
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

                            <Grid2
                              container
                              size={{ xs: 12, sm: 8 }}
                              spacing={1}
                            >
                              {Array.from({ length: exercise.meta.sets }).map(
                                (_, setIndex) => (
                                  <Grid2
                                    container
                                    size={{ xs: 12 }}
                                    key={setIndex}
                                    spacing={0}
                                  >
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                      {/* Set Type Dropdown (Reps/Distance/Time/VO2) */}
                                      <FormControl fullWidth>
                                        <InputLabel>
                                          {options.label[0].toUpperCase() +
                                            options.label.slice(1)}
                                        </InputLabel>
                                        <Select
                                          value={
                                            setValues[exercise.id]?.[setIndex]
                                              ?.setValue || ''
                                          }
                                          onChange={(e) =>
                                            handleSetValueChange(
                                              exercise.id,
                                              setIndex,
                                              e.target.value as string,
                                              'setValue'
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

                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                      {/* Workload Value TextField */}
                                      <TextField
                                        fullWidth
                                        label={exercise.meta.workloadType.toUpperCase()}
                                        type="number"
                                        value={
                                          setValues[exercise.id]?.[setIndex]
                                            ?.workloadValue || ''
                                        }
                                        onChange={(e) =>
                                          handleSetValueChange(
                                            exercise.id,
                                            setIndex,
                                            e.target.value,
                                            'workloadValue'
                                          )
                                        }
                                      />
                                    </Grid2>
                                  </Grid2>
                                )
                              )}

                              <Grid2 size={{ xs: 12 }}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  startIcon={<FitnessCenter />}
                                  onClick={() =>
                                    handleSaveSets(
                                      component.id,
                                      superset.order,
                                      exercise.id
                                    )
                                  }
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
