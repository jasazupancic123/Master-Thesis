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
  DatePicker,
  DesktopDatePicker,
  LocalizationProvider,
  PickersDay,
  PickersDayProps,
} from '@mui/x-date-pickers';
import MyModal from '../modal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import router from 'next/router';
import { handleCopyTraining } from './state';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { handleAddTrainingComponents } from '../trainer-cycle-view/state';
import toast from 'react-hot-toast';
import MuscleHeatmapView from './muscle-heatmap-view';
import { DoNotDisturb } from '@mui/icons-material';
import { setHeapSnapshotNearHeapLimit } from 'v8';

const commonService = CommonService.instance;

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const router = useRouter();
  const { training, trainingComponent } = props;
  const {
    filter,
    setDetectedChanges,
    setTrainings,
    setFilteredTrainings,
    token,
    trainings,
    cycle,
    exercises,
    components,
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
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);

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

    setHighlightedDays(highlightedDays);
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

  const isDateUnavailable = (date: Dayjs): boolean => {
    if (!component) return true;
    const thisCycleTrainings = trainings.filter((t) => t.cycleId === cycle?.id);

    if (
      cycle &&
      (dayjs(cycle.from).isAfter(date) || dayjs(cycle.to).isBefore(date))
    )
      return true;

    return thisCycleTrainings.some(
      (t) =>
        dayjs(t.from).isSame(date, 'day') &&
        ((dayjs(t.from).hour() < 12 &&
          selectedPeriod === 'AM' &&
          t.components.find((c) => c.id === component.id)) ||
          (dayjs(t.from).hour() >= 12 &&
            selectedPeriod === 'PM' &&
            t.components.find((c) => c.id === component.id)))
    );
  };

  const handleCopyComponent = async (newDate: Dayjs) => {
    console.log('component', component);
    //check if there is a training in the period of the date:
    const trainingInPeriod = trainings.find(
      (t) =>
        dayjs(t.from).isSame(newDate, 'day') &&
        ((dayjs(t.from).hour() < 12 && selectedPeriod === 'AM') ||
          (dayjs(t.from).hour() >= 12 && selectedPeriod === 'PM'))
    );

    if (trainingInPeriod) {
      //a training already exists there, just add the same component to it
      const newTraining = {
        ...trainingInPeriod,
        components: [...trainingInPeriod.components],
      };
      const latestComponentInTraining =
        newTraining.components[newTraining.components.length - 1];
      const updatedTrainingComponent = {
        ...trainingComponent,
        from: dayjs(latestComponentInTraining.to).toDate(),
        to: dayjs(latestComponentInTraining.to).add(30, 'minute').toDate(),
      };

      // try {
      //   await handleAddTrainingComponents(
      //     token,
      //     {
      //       trainingId: trainingInPeriod.id,
      //       componentsIds: [updatedTrainingComponent.id],
      //     },
      //     {
      //       router,
      //       components,
      //       setTrainings,
      //       setFilteredTrainings,
      //     }
      //   );
      //   toast.success('Component added to training');
      // } catch (e) {
      //   console.error(e);
      //   toast.error('Failed to add component to training');
      // }
    } else {
      if (!trainingComponent.component) return;
      //no training exsits on the date, create a new training only with the same component
      const newTraining = { ...training, components: [trainingComponent] };
      // handleCopyTraining(
      //   token,
      //   { newDate, period: selectedPeriod },
      //   {
      //     router,
      //     training: newTraining,
      //     cycle: cycle!,
      //     setTrainings,
      //     setFilteredTrainings,
      //     components: [trainingComponent.component],
      //     exercises: exercises,
      //   }
      // );
    }
  };

  const ServerDay = (
    props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }
  ) => {
    if (!trainingComponent || !trainingComponent.component) return null;
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

    const isSelected =
      !props.outsideCurrentMonth &&
      highlightedDays.indexOf(props.day.date()) >= 0;

    const IconComponent = commonService.navigation.getComponentIcon(
      trainingComponent.component.name
    );

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"
        badgeContent={
          isSelected ? <IconComponent sx={{ fontSize: 12 }} /> : null
        }
      >
        <PickersDay
          {...other}
          outsideCurrentMonth={outsideCurrentMonth}
          day={day}
        />
      </Badge>
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
                                      <MonitorHeart
                                        sx={{ mr: 1, opacity: 0.5 }}
                                      />{' '}
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
                              <MonitorHeart sx={{ mr: 1, opacity: 0.5 }} /> Hide
                              Heatmap
                            </>
                          ) : (
                            <>
                              <MonitorHeart sx={{ mr: 1 }} /> Workout Heatmap
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
      >
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Dropdown for AM/PM Selection */}
          <Typography variant="h6">Select Training Period</Typography>
          <Select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value as any)}
            fullWidth
          >
            <MenuItem value="AM">AM</MenuItem>
            <MenuItem value="PM">PM</MenuItem>
          </Select>

          {/* Date Picker */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Typography variant="h6">Select Date</Typography>
            <DesktopDatePicker
              open={datePickerOpen}
              value={null}
              onOpen={() => {
                setSelectedMonth(dayjs());
              }}
              onChange={(newDate) => {
                if (!newDate) return;
                handleCopyComponent(newDate);
              }}
              onClose={() => {}}
              shouldDisableDate={isDateUnavailable}
              slots={{
                day: ServerDay,
              }}
              onMonthChange={(date) => {
                setSelectedMonth(date);
              }}
              onYearChange={(date) => {
                setSelectedMonth(date);
              }}
              slotProps={{
                textField: {
                  disabled: true,
                  InputProps: {
                    endAdornment: (
                      <IconButton
                        onClick={() => setDatePickerOpen(!datePickerOpen)}
                      >
                        <CalendarIcon />
                      </IconButton>
                    ),
                  },
                },
                openPickerButton: {
                  sx: { display: 'flex !important' },
                  onClick: () => {
                    setDatePickerOpen(false);
                  },
                },
                day: {
                  highlightedDays,
                } as any,
              }}
            />
          </LocalizationProvider>
        </Box>
      </MyModal>
    </Box>
  );
}
