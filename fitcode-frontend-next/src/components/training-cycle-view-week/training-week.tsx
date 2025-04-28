import { CommonService } from '@/common/service/common.service';
import { TrainingGridItem } from '@/components/training-cycle-view-week/training-cycle-view-grid-item';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { handleCreateTraining } from '../trainer-cycle-view/state';
import { TrainingCycleViewWeekProps } from './type';
import MyModal from '../modal';
import { Training } from '@/controller/training/type/training.type';
import { useTheme } from '@mui/material';
import { addMinutes, getDate, getTime, setHours, setMinutes } from 'date-fns';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import toast from 'react-hot-toast';
import { TrainingService } from '@/controller/training/training.service';
import { DateRange } from '@/common/type/date-range.type';
import { COLORS } from '@/common/constant/color.constant';

export default function TrainingWeek(props: TrainingCycleViewWeekProps) {
  const {
    index,
    week,
    selected,
    componentCalendarView,
    trainingComponent,
    training,
    setOpenOverwriteModal,
    setTrainingInPeriodForModal,
    handleCopyComponentApiRequest,
  } = props;
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();
  const {
    token,
    group,
    cycle,
    components,
    setCycle,
    setFilteredTrainings,
    filteredTrainings,
    setTrainings,
    exercises: allExercises,
    trainings,
  } = useGroup();

  const [openAreYouSureModal, setOpenAreYouSureModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

  useEffect(() => {}, [filteredTrainings]);

  function getFilteredTrainings(date: Dayjs, period: string) {
    date = dayjs(date);

    const newFilteredTrainings = [];
    let colorIndex = 0;
    const evaluatedTrainingIds: { trainingId: string; colorIndex: number }[] =
      [];
    for (const ft of filteredTrainings) {
      for (const tc of ft.components) {
        if (!tc.copiedFrom) continue;
        const copiedFromTraining = filteredTrainings.find(
          (t) => t.id === tc.copiedFrom?.rootCopiedFromTrainingId
        );
        if (!copiedFromTraining) continue;
        const evaluatedTrainingId = evaluatedTrainingIds.find(
          (t) => t.trainingId === copiedFromTraining.id
        );
        if (evaluatedTrainingId) {
          tc.color = COLORS[evaluatedTrainingId.colorIndex];
        } else {
          evaluatedTrainingIds.push({
            trainingId: copiedFromTraining.id,
            colorIndex,
          });
          const rootTrainingComponent = copiedFromTraining.components.find(
            (c) => trainingComponent?.component?.id === c.component?.id
          );
          if (!rootTrainingComponent) continue;
          rootTrainingComponent.color = COLORS[colorIndex];
          tc.color = COLORS[colorIndex];
          colorIndex++;
        }
      }
      newFilteredTrainings.push(ft);
    }

    return newFilteredTrainings.filter((training) => {
      const trainingDate = dayjs(training.from);
      const start = trainingDate.startOf('day');
      const end = dayjs(training.to).endOf('day');

      // Check if training falls within the given day
      const isBetween = CommonService.instance.date.isBetween(date, start, end);
      if (!isBetween) return false;

      // Apply AM/PM filtering
      if (period === 'AM') return trainingDate.hour() < 12; // Before noon
      if (period === 'PM') return trainingDate.hour() >= 12; // Noon or later

      return false;
    });
  }

  async function handleAddTraining(date: Dayjs, period: 'AM' | 'PM') {
    let from = setMinutes(setHours(date.toDate(), period === 'AM' ? 8 : 14), 0);

    handleCreateTraining(
      token,
      {
        group,
        cycle: cycle!,
        date,
        period,
        selectedComponents: selected!.map((c, i) => ({
          id: c.id,
          subgroups: [],
          supersets: [],
          from: addMinutes(from, i * 30),
          to: addMinutes(addMinutes(from, i * 30), 30),
        })),
      },
      {
        router,
        setCycle,
        filteredTrainings,
        setFilteredTrainings,
        setTrainings,
        components,
      }
    );
  }

  return (
    <Box>
      <Box>
        {/* Render days of the week */}
        <Stack
          direction="row"
          p={2}
          sx={{
            padding: '0px',
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'background.default',
            backgroundColor: 'background.paper',
            height: '100%',
            cursor: components.length ? 'pointer' : 'default',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          {/* Extra column to display the week number */}
          <Typography
            color={theme.palette.background.paper}
            bgcolor={theme.palette.primary.main}
            p={screenSize.isMobile ? 0.1 : 2}
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              borderBottomRightRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            Week {index + 1}
          </Typography>

          {week.map((date, j) => (
            <Box
              key={j}
              width="calc(100% / 7)"
              sx={{
                border: '1px solid',
                borderColor: 'background.default',
                cursor:
                  components.length &&
                  cycle &&
                  CommonService.instance.date.isBetween(
                    date,
                    cycle.from,
                    cycle.to
                  )
                    ? 'pointer'
                    : 'default',
                minHeight: screenSize.isMobile ? 160 : 140,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  height: screenSize.isMobile ? '25%' : '12%',
                }}
              >
                {dayjs(date).format('ddd, DD.MM')}
              </Typography>

              <Divider />

              {['AM', 'PM'].map((period) => (
                <React.Fragment key={period}>
                  {period === 'PM' && (
                    <>
                      <Divider />
                      <Divider />
                    </>
                  )}

                  <Box
                    key={period}
                    sx={{
                      position: 'relative',
                      height: screenSize.isMobile ? '37.5%' : '44%',
                      backgroundColor: !cycle
                        ? 'background.paper'
                        : CommonService.instance.date.isBetween(
                              date,
                              cycle.from,
                              cycle.to
                            )
                          ? 'background.paper'
                          : 'background.default',
                    }}
                    onClick={() => {
                      if (componentCalendarView) {
                        const trainingInPeriod = trainings.find((t) => {
                          const trainingDate = dayjs(t.from);
                          return (
                            trainingDate.isSame(date, 'day') &&
                            trainingDate.format('A') === period
                          );
                        });
                        const trainingInPeriodIncludesComponent =
                          trainingInPeriod?.components.find(
                            (c) =>
                              c.component?.id ===
                              trainingComponent?.component?.id
                          );

                        if (
                          trainingInPeriod &&
                          !trainingInPeriodIncludesComponent
                        ) {
                          //ADD THE SELECTED TRAINING COMPONENT TO THE TRAINING
                          if (handleCopyComponentApiRequest) {
                            handleCopyComponentApiRequest(
                              trainingInPeriod,
                              trainingComponent!,
                              false
                            );
                          }
                        } else if (
                          trainingInPeriod &&
                          trainingInPeriodIncludesComponent
                        ) {
                          //ASK USER IF OVERWRITE THE TRAINING COMPONENT
                          if (
                            setOpenOverwriteModal &&
                            setTrainingInPeriodForModal
                          ) {
                            setTrainingInPeriodForModal(trainingInPeriod);
                            setOpenOverwriteModal(true);
                          }
                        } else if (!trainingInPeriod) {
                          //ADD A NEW TRAINING WITH THE SELECTED TRAINING COMPONENT
                          if (!training) {
                            toast.error('Training not found');
                            return;
                          }
                          if (!trainingComponent) {
                            toast.error('Training component not found');
                            return;
                          }

                          const from =
                            period === 'AM'
                              ? dayjs(date).set('hour', 8)
                              : dayjs(date).set('hour', 14).toDate();
                          const to = dayjs(from).add(30, 'minutes').toDate();

                          handleApiRequest(
                            router,
                            () =>
                              TrainingController.createWithTrainingComponent(
                                token,
                                training.id,
                                {
                                  trainingComponent: trainingComponent,
                                  date: { from, to } as DateRange,
                                }
                              ),
                            (training) => {
                              training = TrainingService.mapComponents(
                                training,
                                components
                              );
                              training = TrainingService.mapExercises(
                                training,
                                allExercises
                              );

                              setTrainings((prev) => [...prev, training]);
                              setFilteredTrainings((prev) => [
                                ...prev,
                                training,
                              ]);
                              toast.success(
                                'Training with current component created successfully'
                              );
                            },
                            undefined,
                            'Failed to create training with current component'
                          );
                        }
                      } else {
                        if (
                          !cycle ||
                          !CommonService.instance.date.isBetween(
                            date,
                            cycle.from,
                            cycle.to
                          )
                        )
                          return;

                        handleAddTraining(date, period as 'AM' | 'PM');
                      }
                    }}
                  >
                    {/* Period Label */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 6,
                        color: '#fff',
                        fontSize: '0.7rem',
                        opacity: 0.7,
                      }}
                    >
                      {period}
                    </Typography>

                    {/* Trainings */}
                    {getFilteredTrainings(date, period).map((training, key) => {
                      return (
                        <Box
                          key={key}
                          borderRadius={componentCalendarView ? 0 : 2}
                          sx={{
                            cursor: 'pointer',
                            p: 0,
                            m: 0,
                            height: '100%',
                            backgroundColor: componentCalendarView
                              ? '#1e3045'
                              : undefined,
                          }}
                          onClick={(e) => {
                            if (
                              !cycle ||
                              !CommonService.instance.date.isBetween(
                                date,
                                cycle.from,
                                cycle.to
                              )
                            )
                              return;

                            if (
                              !props.selected ||
                              props.selected?.length === 0
                            ) {
                              setOpenAreYouSureModal(true);
                              setSelectedTraining(training);
                              return;
                            }

                            e.stopPropagation();

                            const lastTo = new Date(
                              training.components[
                                training.components.length - 1
                              ].to
                            );

                            props.addTrainingComponent(training.id, {
                              components: props.selected?.map((c, i) => ({
                                id: c.id,
                                subgroups: [],
                                supersets: [],
                                from: addMinutes(lastTo, i * 30),
                                to: addMinutes(addMinutes(lastTo, i * 30), 30),
                              })),
                            });
                          }}
                        >
                          {key > 0 && <Divider />}

                          <TrainingGridItem
                            order={key + 1}
                            training={training}
                            addTrainingComponent={props.addTrainingComponent}
                            deleteTrainingComponent={
                              props.deleteTrainingComponent
                            }
                            componentCalendarView={componentCalendarView}
                            trainingComponent={trainingComponent}
                            isSameDayAsSelectedComponent={
                              trainingComponent &&
                              dayjs(training.from).isSame(
                                dayjs(trainingComponent.from),
                                'date'
                              ) &&
                              dayjs(training.from).hour() >= 12 ===
                                dayjs(trainingComponent.from).hour() >= 12
                            }
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
      <MyModal
        isOpen={openAreYouSureModal && !componentCalendarView}
        setIsOpen={(open) => setOpenAreYouSureModal(open)}
        cancelText="Cancel"
        onCancel={() => {
          setOpenAreYouSureModal(false);
          setSelectedTraining(null);
        }}
        onConfirm={() => {
          if (!selectedTraining) return;
          props.addTrainingComponent(selectedTraining.id, {
            components: [],
          });
          setSelectedTraining(null);
          setOpenAreYouSureModal(false);
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Delete {dayjs(selectedTraining?.from).format('A')} training on{' '}
          {dayjs(selectedTraining?.from).format('DD.MM')}
        </Typography>
      </MyModal>
    </Box>
  );
}
