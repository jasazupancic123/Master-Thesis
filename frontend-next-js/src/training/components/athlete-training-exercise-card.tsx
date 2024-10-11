import Stack from '@mui/material/Stack';
import { TrainingComponent } from '@/training/entity/training-component.entity';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  TRAINING_EXERCISE_SET,
  TRAINING_EXERCISE_SET_TYPE,
  TRAINING_EXERCISE_WORKLOAD,
} from '@/common/constant/training-exercise.constant';
import { SetExerciseAttribute } from '@/exercise/components/training-exercise-card';
import Grid2 from '@mui/material/Unstable_Grid2';

interface Props {
  component: TrainingComponent;
}

export default function AthleteTrainingExerciseCard(props: Props) {
  return <Box>
    <Typography sx={{ color: '#1EB980', textTransform: 'uppercase', pt: 3, pb: 1 }}>
      {props.component.component?.name}
    </Typography>

    {/* Supersets */}
    <Stack spacing={1}>
      {props.component.supersets.map((superset, i) => {
        // exercises
        return <Stack direction="row" key={superset.id} spacing={2}>
          <Typography variant="body1">Superset {i + 1}</Typography>

          <Stack spacing={2} direction="row">
            {superset.exercises.map((exercise, i) => {
              return <Stack key={i} spacing={1}>
                <Typography variant="body1">{exercise.exercise?.name}</Typography>

                {/* Target (exercise meta) */}
                <Grid2 container>
                  {/* Sets */}
                  <Grid2 xs={4}>
                    <SetExerciseAttribute
                      options={TRAINING_EXERCISE_SET}
                      state={(() => {
                        const option = TRAINING_EXERCISE_SET.find(option => option.label === 'sets')!;
                        return {
                          type: option.type,
                          values: option.values,
                          option: option.label,
                          format: option.format,
                          value: exercise.meta.sets.toString(),
                        };
                      })()}
                      onChange={() => {
                      }}
                      disabled
                    />
                  </Grid2>

                  {/* Set Type */}
                  <Grid2 xs={4}>
                    <SetExerciseAttribute
                      options={TRAINING_EXERCISE_SET_TYPE}
                      state={(() => {
                        const option = TRAINING_EXERCISE_SET_TYPE.find(option => option.label === exercise.meta.setType)!;
                        return {
                          type: option.type,
                          values: option.values,
                          option: option.label,
                          format: option.format,
                          value: exercise.meta.setTypeValue.toString(),
                        };
                      })()}
                      onChange={() => {
                      }}
                      disabled
                    />
                  </Grid2>

                  {/* Workload */}
                  <Grid2 xs={4}>
                    <SetExerciseAttribute
                      options={TRAINING_EXERCISE_WORKLOAD}
                      state={(() => {
                        const option = TRAINING_EXERCISE_WORKLOAD.find(option => option.label === exercise.meta.workloadType)!;
                        return {
                          type: option.type,
                          values: option.values,
                          option: option.label,
                          format: option.format,
                          value: exercise.meta.workloadValue.toString(),
                        };
                      })()}
                      onChange={() => {
                      }}
                      disabled
                    />
                  </Grid2>
                </Grid2>

                {/* Completed data */}
                {new Array(exercise.meta.sets).fill(0).map((_, i) => {
                  return <Grid2 container key={i} width="100%">
                    <Grid2 xs={4} display="flex" alignItems="center" justifyContent="center" flexGrow={1}>
                      {i + 1}.
                    </Grid2>

                    {/* Reps */}
                    <Grid2 xs={4}>
                      <SetExerciseAttribute
                        options={TRAINING_EXERCISE_SET_TYPE}
                        state={(() => {
                          const option = TRAINING_EXERCISE_SET_TYPE.find(option => option.label === exercise.meta.setType)!;
                          return {
                            type: option.type,
                            values: option.values,
                            option: option.label,
                            format: option.format,
                            value: '5',
                          };
                        })()}
                        onChange={(state) => {
                          console.log('state', state);
                        }}
                      />
                    </Grid2>

                    {/* Workload Value */}
                    <Grid2 xs={4}>
                      <SetExerciseAttribute
                        options={TRAINING_EXERCISE_WORKLOAD}
                        state={(() => {
                          const option = TRAINING_EXERCISE_WORKLOAD.find(option => option.label === exercise.meta.workloadType)!;
                          return {
                            type: option.type,
                            values: option.values,
                            option: option.label,
                            format: option.format,
                            value: '100',
                          };
                        })()}
                        onChange={(state) => {
                          console.log('state', state);
                        }}
                      />
                    </Grid2>
                  </Grid2>;
                })}
              </Stack>;
            })}
          </Stack>
        </Stack>;
      })}
    </Stack>


  </Box>;
}