import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  DatePicker,
  DesktopDatePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MyModal from '../modal/modal';
import { TrainingCardProps } from '../trainer-day-view/props';
import { handleCopyTraining } from '../trainer-day-view/state';
import TrainingComponentLayout from '../training-component-layout/training-component-layout';
import { useTheme } from '@mui/material';
import { useMain } from '@/store/main-provider';

export default function TrainingCard(props: TrainingCardProps) {
  const { components, exercises, methods } = useMain();
  const { trainings, cycle, setTrainings } = useGroup();

  const {
    training: selectedTraining,
    setTraining,
    selectedPeriod,
    setSelectedPeriod,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    setComponent,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext();

  const theme = useTheme();

  const { training, day } = props;

  const screenSize = useScreenSize();
  const router = useRouter();
  const [showCopyTrainingModal, setShowCopyTrainingModal] = useState(false);
  const [justClikedOnCopyDate, setJustClickedOnCopyDate] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false); // Keep it open

  useEffect(() => {
    if (!component || !selectedSubgroup || !selectedSubgroup?.subgroup) return;
    // check if subgroup is still inside the component.subgroups, cuz the selected one might get deleted
    if (
      selectedSubgroup &&
      component.subgroups.findIndex(
        (subgroup) => subgroup.id === selectedSubgroup?.subgroup?.id
      ) === -1
    ) {
      setSelectedSubgroup(null);
    }
  }, [component]);

  useEffect(() => {
    if (!selectedSubgroup?.subgroup) {
      setSelectedAthlete(undefined);
      return;
    }

    if (
      selectedSubgroup.subgroup.membersIds?.findIndex(
        (member) => member === selectedAthlete?.uid
      ) === -1
    )
      setSelectedAthlete(undefined);
  }, [training, selectedSubgroup?.subgroup]);

  const isDateUnavailable = (date: Dayjs): boolean => {
    const thisCycleTrainings = trainings.filter((t) => t.cycleId === cycle?.id);

    if (
      cycle &&
      (dayjs(cycle.from).isAfter(date) || dayjs(cycle.to).isBefore(date))
    )
      return true;

    return thisCycleTrainings.some(
      (t) =>
        dayjs(t.from).isSame(date, 'day') &&
        ((dayjs(t.from).hour() < 12 && selectedPeriod === 'AM') ||
          (dayjs(t.from).hour() >= 12 && selectedPeriod === 'PM'))
    );
  };

  return (
    <Box width="100%">
      <Box display="flex" width="100%">
        <Box display="flex" width="100%" position="relative">
          <Typography
            variant="caption"
            sx={{
              mx: 1,
              fontSize: 10,
              color: theme.palette.background.lightText,
              position: 'absolute',
              top: -1,
              left: 0,
            }}
          >
            {selectedPeriod === 'AM' ? 'Morning' : 'Afternoon'}
          </Typography>

          {cycle && component && (
            <Box
              sx={{
                height: 22,
                maxHeight: 22,
                minWidth: 150,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                backgroundColor: theme.palette.background.dark,
                borderBottomLeftRadius: 100,
                borderBottomRightRadius: 100,
                px: screenSize.isMobile ? 2 : 4,
              }}
            >
              {selectedAthlete ? (
                <Typography
                  textAlign="center"
                  variant="body2"
                  fontSize={12}
                  sx={{ pb: 0.5, color: theme.palette.background.lightText }}
                >
                  {selectedAthlete.displayName}
                </Typography>
              ) : selectedSubgroup?.subgroup ? (
                <TextField
                  value={selectedSubgroup.subgroup.name}
                  variant="standard"
                  size="small"
                  fullWidth
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: 12,
                    textAlign: 'center',
                    width: '100%',
                    p: 0,
                    m: 0,
                    '& .MuiInput-underline:before': {
                      color: 'transparent !important',
                      border: 'none !important',
                    },
                    '& .MuiInput-underline:after': {
                      border: 'none',
                    },
                    '& .MuiInput-underline:hover:before': {
                      border: 'none',
                    },
                    ':hover': {
                      border: 'none',
                    },
                  }}
                  inputProps={{
                    style: {
                      border: 'none',
                      textAlign: 'center',
                      fontSize: 12,
                      paddingTop: 0,
                      paddingBottom: 0,
                    },
                  }}
                  onChange={(e) => {
                    setSelectedSubgroup((prev) => {
                      if (!prev || !prev.subgroup) return null;
                      const updatedSubgroup = {
                        ...prev.subgroup,
                        name: e.target.value,
                      };
                      const updatedComponent = {
                        ...component,
                        subgroups: component.subgroups.map((sg) =>
                          sg.id === prev.subgroup?.id ? updatedSubgroup : sg
                        ),
                      };
                      setComponent(updatedComponent);
                      setTraining((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          components: prev.components.map((c) =>
                            c.id === component.id ? updatedComponent : c
                          ),
                        };
                      });

                      return {
                        ...prev,
                        subgroup: updatedSubgroup,
                      };
                    });
                  }}
                />
              ) : (
                <Typography
                  textAlign="center"
                  variant="body2"
                  fontSize={12}
                  sx={{ pb: 0.5, color: theme.palette.background.lightText }}
                >
                  Main group
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: theme.palette.background.default,
          px: 1,
        }}
      >
        {training && (
          <>
            <TrainingComponentLayout
              key={0}
              training={training}
              trainingComponent={training.warmup}
              day={day}
            />
            {training.components.map((trainingComponent, i) => (
              <TrainingComponentLayout
                key={i + 1}
                training={training}
                trainingComponent={trainingComponent}
                day={day}
              />
            ))}
            <TrainingComponentLayout
              key={training.components.length + 1}
              training={training}
              trainingComponent={training.cooldown}
              day={day}
            />
          </>
        )}
      </Box>

      <MyModal
        isOpen={showCopyTrainingModal}
        setIsOpen={(open) => setShowCopyTrainingModal(open)}
        cancelText="Close"
        onCancel={() => {
          setShowCopyTrainingModal(false);
          setSelectedPeriod('AM');
          setDatePickerOpen(false);
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
            {!screenSize.isLandscapeMobile ? (
              <DesktopDatePicker
                open={datePickerOpen}
                value={null}
                onChange={(newDate) => {
                  if (!newDate) return;
                  setJustClickedOnCopyDate(true);
                  handleCopyTraining(
                    { newDate, period: selectedPeriod },
                    {
                      router,
                      training,
                      cycle: cycle!,
                      setTrainings,
                      day,
                      components,
                      exercises,
                      methods,
                    }
                  );
                }}
                onClose={() => {
                  if (!justClikedOnCopyDate) {
                    setDatePickerOpen(false);
                    setJustClickedOnCopyDate(false);
                  }
                }}
                shouldDisableDate={isDateUnavailable}
                slotProps={{
                  textField: {
                    disabled: true,
                    InputProps: {
                      endAdornment: (
                        <IconButton
                          onClick={() => setDatePickerOpen(!datePickerOpen)}
                        >
                          <CalendarMonthIcon />
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
                }}
              />
            ) : (
              <DatePicker
                value={null}
                onChange={(newDate) => {
                  if (!newDate) return;

                  handleCopyTraining(
                    { newDate, period: selectedPeriod },
                    {
                      router,
                      training,
                      cycle: cycle!,
                      setTrainings,
                      day,
                      components,
                      exercises,
                      methods,
                    }
                  );
                }}
                shouldDisableDate={isDateUnavailable}
              />
            )}
          </LocalizationProvider>
        </Box>
      </MyModal>
    </Box>
  );
}
