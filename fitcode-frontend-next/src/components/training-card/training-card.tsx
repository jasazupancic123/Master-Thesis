import { COLORS } from '@/common/constant/color.constant';
import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { FileCopy } from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
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

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const {
    token,
    trainings,
    cycle,
    setTrainings,
    components,
    exercises,
    methods,
  } = useGroup();

  const {
    training: selectedTraining,
    setTodaysTrainings,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext();

  const { training, period, day } = props;

  const screenSize = useScreenSize();
  const router = useRouter();
  const [showCopyTrainingModal, setShowCopyTrainingModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
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
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="wrap"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
          pl={0.9375}
          pb={1.25}
        >
          <Box
            width={6}
            height={10}
            sx={{
              backgroundColor:
                !selectedSubgroup?.subgroup &&
                selectedTraining?.id === training.id
                  ? '#9e9e9e'
                  : selectedSubgroup?.subgroup &&
                      selectedTraining?.id === training.id
                    ? COLORS[selectedSubgroup.index % COLORS.length]
                    : '#005D57',
              borderRadius: 10,
            }}
          />
          <Typography variant="caption" sx={{ mx: 1, fontSize: 12 }}>
            {period === 'AM' ? 'Morning' : 'Afternoon'}
          </Typography>

          <Tooltip title="Copy training">
            <IconButton
              sx={{ p: 0, m: 0, pr: 1 }}
              onClick={() => {
                setShowCopyTrainingModal(true);
              }}
            >
              <FileCopy sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: 'background.paper',
          px: 1,
          mt: -1,
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
                    token,
                    { newDate, period: selectedPeriod },
                    {
                      router,
                      training,
                      cycle: cycle!,
                      setTrainings,
                      setTodaysTrainings,
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
                    token,
                    { newDate, period: selectedPeriod },
                    {
                      router,
                      training,
                      cycle: cycle!,
                      setTrainings,
                      setTodaysTrainings,
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
