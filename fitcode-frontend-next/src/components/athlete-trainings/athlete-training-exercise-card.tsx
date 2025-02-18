import { COLOR } from '@/common/constant/browser.constant';
import {
  DISTANCE_OPTIONS,
  REP_OPTIONS,
  TIME_OPTIONS,
  VO2_OPTIONS,
} from '@/common/constant/training-exercise.constant';
import { CommonService } from '@/common/service/common.service';
import { handleApiRequest } from '@/common/type/state.type';
import { useScreenSize } from '@/context/screen-size-provider';
import { SetStatus } from '@/controller/training/enum/set-status.enum';
import { SetType } from '@/controller/training/enum/set-type.enum';
import { TrainingController } from '@/controller/training/training.controller';
import { SetData } from '@/controller/training/type/set-data';
import {
  TrainingComponent,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { ScreenSearchDesktop, SvgIconComponent } from '@mui/icons-material';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid2 from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import BorderColor from '../border-color';
import { AthleteTrainingExerciseCardProps } from './props';

const commonService = CommonService.instance;

export default function AthleteTrainingExerciseCard(
  props: AthleteTrainingExerciseCardProps
) {
  const { token, components, training } = props;
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  // State to manage input values for each set
  const [setValues, setSetValues] = useState<
    Record<string, Array<{ setValue: string; workloadValue: string }>>
  >({});

  const [component, setComponent] = useState(components[0]);

  const [selectedExercise, setSelectedExercise] =
    useState<TrainingExercise | null>(null);

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
            .flatMap((s) => s.exercises)
            .find((e) => e.id === exerciseId)?.meta?.sets || 0
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
    const values: SetData[] = (setValues[exerciseId] || []).map((val, i) => ({
      status: SetStatus.COMPLETED,
      setNumber: i + 1,
      setTypeValue: +val.setValue,
      workloadValue: val.workloadValue,
    }));

    handleApiRequest(
      router,
      () =>
        TrainingController.updateAthleteWorkload(
          token,
          training!.id,
          componentId,
          superset,
          exerciseId,
          { sets: values }
        ),
      () => {
        toast.success('Successfully updated sets!');
      },
      undefined
    );
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
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box width="100%" display="flex" justifyContent="center">
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Box
            display="flex"
            width="100%"
            sx={{
              overflow: 'visible',
              whiteSpace: 'nowrap',
              '-webkit-overflow-scrolling': 'touch', // Smooth scrolling on iOS
              overflowX: screenSize.isSmallerThanLaptop
                ? 'scroll'
                : components.length > 4
                  ? 'scroll'
                  : 'hidden',
              '&::-webkit-scrollbar': {
                height: '8px', // Scrollbar height
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.5)', // Scrollbar color
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)', // Track color
              },
              scrollbarWidth: 'thin', // For Firefox
              scrollbarColor: `rgba(187, 187, 187, 0.5) ${theme.palette.background.default}`, // For Firefox
            }}
          >
            {components.map((comp: TrainingComponent, index, arr) => (
              <Typography
                key={`component-${comp.id}`}
                variant={screenSize.isMobile ? 'h6' : 'h5'}
                sx={{
                  flex:
                    arr.length > 4 ? '0 0 auto' : `1 1 ${100 / arr.length}%`,
                  width: screenSize.isSmallerThanLaptop
                    ? undefined
                    : arr.length > 4
                      ? '25%'
                      : `${100 / arr.length}%`, // Ensures even distribution for 3 or less
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: comp.id === component.id ? 'primary.main' : 'white',
                  backgroundColor: 'background.paper',
                  px: 2,
                  py: 1,
                  zIndex: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setComponent(comp);
                }}
              >
                <Box display="flex" justifyContent="center" alignItems="center">
                  {comp.id}
                </Box>
              </Typography>
            ))}
          </Box>

          <CardContent
            sx={{ backgroundColor: theme.palette.background.default }}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {component.supersets.map((superset, i) => (
                <Box key={`superset-${i}-${i}`}>
                  <BorderColor
                    color={superset.color || COLOR[i]}
                    applyMargin={superset.exercises.length === 0}
                  />

                  <Box
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      borderLeft: `4px solid ${superset.color}`,
                    }}
                  >
                    {superset.exercises.map((exercise, exerciseIndex) => {
                      const options = getOptions(exercise);

                      return selectedExercise?.id === exercise.id ? (
                        <Box
                          key={`exe ${exercise.id} - ${exercise.exercise?.name}`}
                          display="flex"
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          gap={2}
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            width="100%"
                            sx={{
                              backgroundColor: 'background.paper',
                            }}
                          >
                            <Box
                              flex={{ xs: '1 1 100%', sm: '1 1 30%' }}
                              display="flex"
                              flexDirection="column"
                              alignItems="center"
                              justifyContent="center"
                              pb={1}
                            >
                              <Box
                                sx={{
                                  borderRadius: 2,
                                  boxShadow: 0,
                                  width: '100%',
                                  backgroundColor: 'background.paper',
                                }}
                              >
                                <Box sx={{ textAlign: 'center' }}>
                                  <Box
                                    display="flex"
                                    justifyContent="center"
                                    mt={1}
                                  >
                                    <IconButton
                                      onClick={() => setSelectedExercise(null)}
                                      sx={{
                                        py: 0,
                                        m: 0,
                                        position: 'absolute',
                                        right: 20,
                                      }}
                                    >
                                      <VisibilityOffIcon />
                                    </IconButton>
                                  </Box>

                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 'bold',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {exercise.exercise?.name ||
                                      'Unnamed Exercise'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {/* Set Details */}
                            <Box
                              flex={{ xs: '1 1 100%', sm: '1 1 70%' }}
                              display="flex"
                              flexDirection="column"
                              py={1}
                              px={screenSize.isMobile ? 1 : 0}
                              alignItems="center"
                              gap={1}
                              sx={{
                                backgroundColor: 'background.paper',
                              }}
                            >
                              {Array.from({
                                length: exercise.meta.sets,
                              }).map((_, setIndex) => (
                                <Box
                                  key={`${exercise.id}-set-${setIndex}`}
                                  display="flex"
                                  gap={1}
                                  minWidth={
                                    !screenSize.isSmallerThanLaptop
                                      ? 300
                                      : undefined
                                  }
                                >
                                  {/* Set Type Dropdown */}
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
                                        <MenuItem
                                          key={`${exercise.id}-option-${value}-set-${setIndex}-type-${options.label}`}
                                          value={value}
                                        >
                                          {options.format(value)}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  {/* Workload Input */}
                                  <TextField
                                    fullWidth
                                    label={exercise.meta.workloadType.toUpperCase()}
                                    type="number"
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
                                  />
                                </Box>
                              ))}

                              {/* Save Button */}
                              <Button
                                variant="contained"
                                onClick={() =>
                                  handleSaveSets(component.id, i, exercise.id)
                                }
                                sx={{ mt: 1 }}
                              >
                                Save Sets
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          display="flex"
                          width="100%"
                          justifyContent="center"
                          alignItems="center"
                          borderTop={
                            exerciseIndex > 0
                              ? `3px solid ${theme.palette.background.paper}`
                              : undefined
                          }
                          borderBottom={
                            exerciseIndex < superset.exercises.length - 1
                              ? `3px solid ${theme.palette.background.paper}`
                              : undefined
                          }
                          sx={{ backgroundColor: 'background.default' }}
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

                          <IconButton
                            onClick={() => setSelectedExercise(exercise)}
                            sx={{
                              py: 0,
                              m: 0,
                              position: 'absolute',
                              right: 20,
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>

                  <BorderColor
                    color={superset.color || COLOR[i]}
                    lower
                    applyMargin={superset.exercises.length === 0}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Box>
      </Box>
    </Box>
  );
}
