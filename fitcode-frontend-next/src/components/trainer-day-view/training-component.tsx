import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import { Method } from '@/controller/component/type/method.type';
import {
  Delete,
  MonitorHeart,
  MoreVert,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SelectInput from '../select-input';
import { AFTER_SETS, MAIN_SETS, METHODS } from './constant';
import { TrainingComponentProps } from './props';
import Supersets from './supersets';
import { useTheme } from '@mui/material';
import {
  CalendarIcon,
  DesktopDatePicker,
  LocalizationProvider,
  PickersDay,
  PickersDayProps,
} from '@mui/x-date-pickers';
import MyModal from '../modal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import MuscleHeatmapView from './muscle-heatmap-view';
import { DoNotDisturb } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { handleApiRequest } from '@/common/type/state.type';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { CopiedFrom } from '@/controller/component/type/copied-from.type';
import { Component } from '@/controller/component/type/component.type';
import { TrainingService } from '@/controller/training/training.service';
import { ComponentService } from '@/controller/component/component.service';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Training } from '@/controller/training/type/training.type';
import { DateRange } from '@/common/type/date-range.type';
import { COLORS } from '@/common/constant/color.constant';
import TrainerCycleView from '@/app/groups/[group_id]/trainer-group-cycle-view';
import TrainingComponentCalendar from './training-component-calendar';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';

const commonService = CommonService.instance;

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();

  const { training, trainingComponent } = props;
  const {
    token,
    filter,
    setDetectedChanges,
    setTrainings,
    filteredTrainings,
    setFilteredTrainings,
    trainings,
    cycle,
    components: allComponents,
    exercises: allExercises,
  } = useGroup();

  const {
    training: selectedTraining,
    setTraining,
    component,
    setComponent,
  } = useTrainerDayViewContext();

  const [mainSet, setMainSet] = useState<MainSet | null>();
  const [afterSet, setAfterSet] = useState<AfterSet | null>();
  const [method, setMethod] = useState<Method | null>();
  const [openAddExerciseModal, setOpenAddExerciseModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openCalendarModal, setOpenCalendarModal] = useState(false);
  const [heatmapView, setHeatmapView] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [datePickerOpen, setDatePickerOpen] = useState(false); // Keep it open
  const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
  const [trainingDays, setTrainingDays] = useState<number[]>([]);
  const [groupedTrainingsByRootIds, setGroupedTrainingsByRootIds] = useState<
    {
      id: string;
      trainings: number[];
      color: string;
    }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [openOverwriteModal, setOpenOverwriteModal] = useState(false);
  const [trainingInPeriodForModal, setTrainingInPeriodForModal] =
    useState<Training | null>(null);

  useEffect(() => {
    if (!trainingComponent) return;
    const thisCycleTrainings = trainings.filter((t) => t.cycleId === cycle?.id);
    let highlightedDays = thisCycleTrainings
      .filter(
        (t) =>
          (selectedPeriod === 'AM' && dayjs(t.from).hour() < 12) ||
          (selectedPeriod === 'PM' && dayjs(t.from).hour() >= 12)
      )
      .filter((t) =>
        selectedMonth
          ? dayjs(t.from).isSame(selectedMonth, 'month') &&
            dayjs(t.from).isSame(selectedMonth, 'year')
          : true
      )
      .filter((t) => t.components.find((c) => c.id === trainingComponent.id))
      .map((t) => dayjs(t.from).date());

    let trainingDays = thisCycleTrainings
      .filter(
        (t) =>
          (selectedPeriod === 'AM' && dayjs(t.from).hour() < 12) ||
          (selectedPeriod === 'PM' && dayjs(t.from).hour() >= 12)
      )
      .filter((t) =>
        selectedMonth
          ? dayjs(t.from).isSame(selectedMonth, 'month') &&
            dayjs(t.from).isSame(selectedMonth, 'year')
          : true
      )
      .map((t) => dayjs(t.from).date());

    setHighlightedDays(highlightedDays);
    setTrainingDays(trainingDays);

    const trainingsCopiedFrom = [] as {
      id: string;
      trainings: number[];
      color: string;
    }[];
    for (const training of thisCycleTrainings) {
      training.components.forEach((c) => {
        if (c.copiedFrom) {
          const foundElement = trainingsCopiedFrom.find(
            (t) => t.id === c.copiedFrom?.rootCopiedFromTrainingId
          );
          if (
            foundElement &&
            !foundElement.trainings.includes(dayjs(training.from).date())
          ) {
            foundElement.trainings.push(dayjs(training.from).date());
          } else {
            const trainingsForCopied = [dayjs(training.from).date()];

            const rootTraining = trainings.find(
              (t) => t.id === c.copiedFrom?.rootCopiedFromTrainingId
            );

            //check if its the same month
            if (
              rootTraining &&
              selectedMonth &&
              dayjs(selectedMonth).isSame(rootTraining.from, 'month')
            ) {
              trainingsForCopied.push(dayjs(rootTraining.from).date());
            }
            trainingsCopiedFrom.push({
              id: c.copiedFrom.rootCopiedFromTrainingId,
              trainings: trainingsForCopied,
              color: COLORS[trainingsCopiedFrom.length % COLORS.length],
            });
          }
        }
      });
    }

    setGroupedTrainingsByRootIds(trainingsCopiedFrom);
  }, [selectedPeriod, selectedMonth, trainings]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleVisibility = () => {
    if (
      trainingComponent &&
      component &&
      trainingComponent.id === component.id
    ) {
      setTraining(undefined);
      setComponent(undefined);
    } else {
      setTraining(training);
      setComponent(trainingComponent);
    }
    setHeatmapView(false);
    handleMenuClose();
  };

  const isWarmupOrCooldown = (component: TrainingComponent) => {
    return component.id === WARMUP_ID || component.id === COOLDOWN_ID;
  };

  const handleCopyComponentApiRequest = async (
    trainingInPeriod: Training,
    component: TrainingComponent,
    overwrite: boolean = false
  ) => {
    handleApiRequest(
      router,
      () =>
        TrainingController.copyComponent(token, trainingInPeriod.id, {
          trainingComponent: component,
          copiedFromTrainingId: training.id,
          overwrite,
        }),
      (training) => {
        training = TrainingService.mapComponents(training, allComponents);
        training = TrainingService.mapExercises(training, allExercises);

        setTrainings((prev) =>
          prev.map((t) => (t.id === training.id ? training : t))
        );
        setFilteredTrainings((prev) =>
          prev.map((t) => (t.id === training.id ? training : t))
        );
        toast.success('Component copied successfully');
      },
      undefined,
      'Failed to copy component'
    );
  };

  return (
    <Box my={1} p={0} px={0}>
      <>
        <Box sx={{ bgcolor: 'background.paper', my: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack
              direction={
                screenSize.isMobile ||
                (screenSize.isLandscapeMobile &&
                  trainingComponent === component)
                  ? 'column'
                  : 'row'
              }
              alignItems="center"
              width="100%"
              justifyContent="space-between"
            >
              <Box
                display="flex"
                p={0}
                justifyContent="space-between"
                alignItems="center"
                flexDirection={screenSize.isMobile ? 'column' : 'row'}
                width="100%"
                position="relative"
              >
                <Box display="flex" p={0} py={1}>
                  {trainingComponent.component &&
                    (() => {
                      const IconComponent =
                        commonService.navigation.getComponentIcon(
                          trainingComponent.component.name
                        );

                      return (
                        <Box display="flex" alignItems="center">
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{ cursor: 'pointer', p: 0, m: 0 }}
                            onClick={() => {
                              if (trainingComponent && !component) {
                                setTraining(training);
                                setComponent(trainingComponent);
                              }
                            }}
                          >
                            {component &&
                            trainingComponent &&
                            trainingComponent.id === component.id ? (
                              <Tooltip
                                title="Add exercise"
                                sx={{
                                  cursor: 'pointer',
                                }}
                              >
                                <IconButton
                                  onClick={() => {
                                    if (
                                      component &&
                                      trainingComponent &&
                                      trainingComponent.id === component.id
                                    )
                                      setOpenAddExerciseModal(true);
                                  }}
                                  sx={{ p: 0, m: 0 }}
                                >
                                  <IconComponent
                                    fontSize="medium"
                                    color="primary"
                                  />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <IconComponent
                                fontSize="medium"
                                color="primary"
                              />
                            )}

                            <Typography
                              variant="h6"
                              sx={{
                                color: theme.palette.primary.main,
                                pl: 1,
                                mb: 0,
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                              }}
                              onClick={() => {
                                if (
                                  trainingComponent &&
                                  component &&
                                  trainingComponent.id === component.id
                                ) {
                                  setTraining(undefined);
                                  setComponent(undefined);
                                } else {
                                  setTraining(training);
                                  setComponent(trainingComponent);
                                }
                              }}
                            >
                              {trainingComponent.component.name}
                            </Typography>
                          </Box>

                          {screenSize.isMobile ? (
                            <Typography variant="caption" ml={2}>
                              {commonService.date.formatTime(
                                trainingComponent.from
                              )}
                            </Typography>
                          ) : (
                            <Typography variant="caption" ml={2}>
                              {commonService.date.formatTime(
                                trainingComponent.from
                              )}
                            </Typography>
                          )}

                          {screenSize.isMobile && (
                            <Box position="absolute" right={0}>
                              <IconButton
                                sx={{ p: 0 }}
                                onClick={handleMenuOpen}
                              >
                                <MoreVert />
                              </IconButton>

                              <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                              >
                                <MenuItem onClick={handleToggleVisibility}>
                                  {trainingComponent &&
                                  component &&
                                  training.id === selectedTraining?.id &&
                                  trainingComponent.id === component.id ? (
                                    <>
                                      <VisibilityOff sx={{ mr: 1 }} /> Hide
                                      Component
                                    </>
                                  ) : (
                                    <>
                                      <Visibility sx={{ mr: 1 }} /> Show
                                      Component
                                    </>
                                  )}
                                </MenuItem>

                                {!isWarmupOrCooldown(trainingComponent) && (
                                  <>
                                    <MenuItem
                                      onClick={() => {
                                        if (
                                          !component ||
                                          trainingComponent.id !== component.id
                                        ) {
                                          setTraining(training);
                                          setComponent(trainingComponent);
                                        }

                                        setSelectedMonth(dayjs());
                                        setOpenCalendarModal(true);
                                        handleMenuClose();
                                      }}
                                    >
                                      <CalendarIcon sx={{ mr: 1 }} /> Component
                                      Calendar
                                    </MenuItem>

                                    <MenuItem
                                      onClick={() => {
                                        if (
                                          trainingComponent &&
                                          component &&
                                          training.id ===
                                            selectedTraining?.id &&
                                          trainingComponent.id ===
                                            component.id &&
                                          heatmapView
                                        ) {
                                          setHeatmapView(false);
                                          handleMenuClose();
                                          return;
                                        }
                                        if (
                                          !component ||
                                          trainingComponent.id !== component.id
                                        ) {
                                          setTraining(training);
                                          setComponent(trainingComponent);
                                        }

                                        setHeatmapView(true);
                                        handleMenuClose();
                                      }}
                                    >
                                      {trainingComponent &&
                                      component &&
                                      training.id === selectedTraining?.id &&
                                      trainingComponent.id === component.id &&
                                      heatmapView ? (
                                        <>
                                          <DoNotDisturb
                                            sx={{
                                              position: 'absolute',
                                              fontSize: 22,
                                            }}
                                          />
                                          <MonitorHeart
                                            sx={{ mr: 1, opacity: 0.5 }}
                                          />{' '}
                                          Hide Heatmap
                                        </>
                                      ) : (
                                        <>
                                          <MonitorHeart sx={{ mr: 1 }} />{' '}
                                          Workout Heatmap
                                        </>
                                      )}
                                    </MenuItem>

                                    <MenuItem
                                      onClick={() => {
                                        const newTraining = { ...training };
                                        newTraining.components =
                                          newTraining.components.filter(
                                            (c) => c.id !== trainingComponent.id
                                          );
                                        newTraining.avgFutureWorkloadValues =
                                          newTraining.avgFutureWorkloadValues.filter(
                                            (c) =>
                                              c.rootComponentId !==
                                              trainingComponent.component?.id
                                          );
                                        setTraining(newTraining);
                                        setFilteredTrainings((prev) =>
                                          prev.map((t) =>
                                            t.id === training.id
                                              ? newTraining
                                              : t
                                          )
                                        );
                                        setDetectedChanges(true);
                                        handleMenuClose();
                                      }}
                                    >
                                      <Delete sx={{ mr: 1 }} /> Delete Component
                                    </MenuItem>
                                  </>
                                )}
                              </Menu>
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                </Box>
                <Box
                  display="flex"
                  width={screenSize.isMobile ? '100%' : undefined}
                  p={0}
                  mr={1}
                  alignItems="center"
                  flexDirection={screenSize.isMobile ? 'column' : 'row'}
                >
                  {trainingComponent &&
                    component &&
                    trainingComponent.id === component.id && (
                      <Box
                        width={screenSize.isMobile ? '100%' : undefined}
                        display={screenSize.isMobile ? 'flex' : undefined}
                        flexDirection={
                          screenSize.isMobile ? 'column' : undefined
                        }
                        alignItems={screenSize.isMobile ? 'center' : undefined}
                        mt={screenSize.isMobile ? 2.5 : 1.5}
                      >
                        <SelectInput<MainSet>
                          label={'Main Set'}
                          value={mainSet?.id || ''}
                          icon={null}
                          items={MAIN_SETS}
                          itemKey="id"
                          itemName="name"
                          placeholder="Main Set"
                          disableInputLabel={false}
                          setValue={(mainSetId) => {
                            setDetectedChanges(true);
                            const mainSet = MAIN_SETS.find(
                              (g) => g.id === mainSetId
                            )!;

                            setMainSet(mainSet);
                          }}
                        />

                        <SelectInput<AfterSet>
                          label={'After Set'}
                          value={afterSet?.id || ''}
                          icon={null}
                          items={AFTER_SETS}
                          itemKey="id"
                          itemName="name"
                          placeholder="After Set"
                          disableInputLabel={false}
                          setValue={(afterSetId) => {
                            setDetectedChanges(true);
                            const afterSet = AFTER_SETS.find(
                              (g) => g.id === afterSetId
                            )!;

                            setAfterSet(afterSet);
                          }}
                        />

                        <SelectInput<MainSet>
                          label={'Method'}
                          value={method?.id || ''}
                          icon={null}
                          items={METHODS}
                          itemKey="id"
                          itemName="name"
                          placeholder="Method"
                          disableInputLabel={false}
                          setValue={(methodId) => {
                            setDetectedChanges(true);
                            const method = METHODS.find(
                              (g) => g.id === methodId
                            )!;
                            setMethod(method);
                          }}
                        />
                      </Box>
                    )}

                  {!screenSize.isMobile && (
                    <>
                      <IconButton sx={{ p: 0 }} onClick={handleMenuOpen}>
                        <MoreVert />
                      </IconButton>

                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={handleToggleVisibility}>
                          {trainingComponent &&
                          component &&
                          training.id === selectedTraining?.id &&
                          trainingComponent.id === component.id ? (
                            <>
                              <VisibilityOff sx={{ mr: 1 }} /> Hide Component
                            </>
                          ) : (
                            <>
                              <Visibility sx={{ mr: 1 }} /> Show Component
                            </>
                          )}
                        </MenuItem>

                        {!isWarmupOrCooldown(trainingComponent) && (
                          <>
                            <MenuItem
                              onClick={() => {
                                if (
                                  !component ||
                                  trainingComponent.id !== component.id
                                ) {
                                  setTraining(training);
                                  setComponent(trainingComponent);
                                }

                                setSelectedMonth(dayjs());
                                setOpenCalendarModal(true);
                                handleMenuClose();
                              }}
                            >
                              <CalendarIcon sx={{ mr: 1 }} /> Component Calendar
                            </MenuItem>

                            <MenuItem
                              onClick={() => {
                                if (
                                  trainingComponent &&
                                  component &&
                                  training.id === selectedTraining?.id &&
                                  trainingComponent.id === component.id &&
                                  heatmapView
                                ) {
                                  setHeatmapView(false);
                                  handleMenuClose();
                                  return;
                                }
                                if (
                                  !component ||
                                  trainingComponent.id !== component.id
                                ) {
                                  setTraining(training);
                                  setComponent(trainingComponent);
                                }

                                setHeatmapView(true);
                                handleMenuClose();
                              }}
                            >
                              {trainingComponent &&
                              component &&
                              training.id === selectedTraining?.id &&
                              trainingComponent.id === component.id &&
                              heatmapView ? (
                                <>
                                  <DoNotDisturb
                                    sx={{
                                      position: 'absolute',
                                      fontSize: 22,
                                    }}
                                  />
                                  <MonitorHeart sx={{ mr: 1, opacity: 0.5 }} />{' '}
                                  Hide Heatmap
                                </>
                              ) : (
                                <>
                                  <MonitorHeart sx={{ mr: 1 }} /> Workout
                                  Heatmap
                                </>
                              )}
                            </MenuItem>

                            <MenuItem
                              onClick={() => {
                                const newTraining = { ...training };
                                newTraining.components =
                                  newTraining.components.filter(
                                    (c) => c.id !== trainingComponent.id
                                  );
                                newTraining.avgFutureWorkloadValues =
                                  newTraining.avgFutureWorkloadValues.filter(
                                    (c) =>
                                      c.rootComponentId !==
                                      trainingComponent.component?.id
                                  );
                                setTraining(newTraining);
                                setFilteredTrainings((prev) =>
                                  prev.map((t) =>
                                    t.id === training.id ? newTraining : t
                                  )
                                );
                                setDetectedChanges(true);
                                handleMenuClose();
                              }}
                            >
                              <Delete sx={{ mr: 1 }} /> Delete Component
                            </MenuItem>
                          </>
                        )}
                      </Menu>
                    </>
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>

          {component &&
            trainingComponent.id === component.id &&
            training.id === selectedTraining?.id && (
              <Box
                bgcolor="background.paper"
                p={2}
                pt={0}
                px={
                  screenSize.isMobile || screenSize.isLandscapeMobile
                    ? 0
                    : undefined
                }
                key={filter}
              >
                {heatmapView ? (
                  <MuscleHeatmapView setHeatmapView={setHeatmapView} />
                ) : (
                  <Supersets
                    openAddExerciseModal={openAddExerciseModal}
                    setOpenAddExerciseModal={setOpenAddExerciseModal}
                  />
                )}
              </Box>
            )}
        </Box>
      </>
      <MyModal
        isOpen={openCalendarModal}
        setIsOpen={(open) => setOpenCalendarModal(open)}
        cancelText="Close"
        onCancel={() => {
          setOpenCalendarModal(false);
          setSelectedPeriod('AM');
          setDatePickerOpen(false);
          setHighlightedDays([]);
        }}
        dialogueContentSx={{
          minWidth: screenSize.isTablet
            ? 500
            : screenSize.isSmallerThanLaptop
              ? 300
              : 1000,
        }}
        componentCalendarView
      >
        <TrainingComponentCalendar
          trainingComponent={trainingComponent}
          training={training}
          setOpenOverwriteModal={setOpenOverwriteModal}
          setTrainingInPeriodForModal={setTrainingInPeriodForModal}
          handleCopyComponentApiRequest={handleCopyComponentApiRequest}
        />
      </MyModal>
      <MyModal
        isOpen={openOverwriteModal}
        setIsOpen={(open) => setOpenOverwriteModal(open)}
        cancelText="Close"
        onCancel={() => {
          setTrainingInPeriodForModal(null);
          setOpenOverwriteModal(false);
        }}
        onConfirm={async () => {
          if (!trainingInPeriodForModal) {
            toast.error('No training found for the selected date');
            return;
          }
          handleCopyComponentApiRequest(
            trainingInPeriodForModal,
            trainingComponent,
            true
          );
          setTrainingInPeriodForModal(null);
          setOpenOverwriteModal(false);
        }}
      >
        Overwrite existing component?
      </MyModal>
    </Box>
  );
}
