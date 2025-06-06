import { COLORS } from '@/common/constant/color.constant';
import { CommonService } from '@/common/service/common.service';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
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
import MyModal from '../modal';
import { TrainingCardProps } from './props';
import { handleCopyTraining } from './state';
import TrainingComponentCard from './training-component';

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const { training, period } = props;
  const {
    token,
    trainings,
    cycle,
    setFilteredTrainings,
    setTrainings,
    components,
    exercises,
    methods,
  } = useGroup();

  const {
    training: selectedTraining,
    selectedSubgroup,
    setSelectedSubgroup,
    component,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext();

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
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
          p={0}
        >
          <Box
            p={2}
            mr={1}
            sx={{
              backgroundColor:
                !selectedSubgroup?.subgroup &&
                selectedTraining?.id === training.id
                  ? '#9e9e9e'
                  : selectedSubgroup?.subgroup &&
                      selectedTraining?.id === training.id
                    ? COLORS[selectedSubgroup.index % COLORS.length]
                    : '#005D57',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption" sx={{ mx: 1 }}>
            {period}
          </Typography>

          <Typography variant="caption" sx={{ mx: 1 }}>
            {commonService.date.formatTime(training.from)}
          </Typography>
          <Tooltip title="Copy training">
            <IconButton
              sx={{ p: 0, m: 0, pr: 1 }}
              onClick={() => {
                setShowCopyTrainingModal(true);
              }}
            >
              <FileCopy sx={{ fontSize: 18 }} />
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
            <TrainingComponentCard
              key={0}
              training={training}
              trainingComponent={training.warmup}
            />
            {training.components.map((trainingComponent, i) => (
              <TrainingComponentCard
                key={i + 1}
                training={training}
                trainingComponent={trainingComponent}
              />
            ))}
            <TrainingComponentCard
              key={training.components.length + 1}
              training={training}
              trainingComponent={training.cooldown}
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
                      setFilteredTrainings,
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
                      setFilteredTrainings,
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
