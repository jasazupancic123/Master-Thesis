import { theme } from '@/app/style';
import { AuthUser } from '@/core/auth/type/user.type';
import { Cycle } from '@/core/group/type/cycle.type';
import { Training } from '@/core/training/type/training.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { SetState } from '@/lib/common/type/state.type';
import { SearchBar } from '@/ui/search-bar/search-bar';
import UserSelect from '@/ui/user-select';
import {
  Avatar,
  Box,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import useAthleteExerciseReportDataGridHeader from './hooks/use-header';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/store/dashboard.provider';
import { PercentageCalculation } from './enum/percentage-calculation.enum';

interface Props {
  selectedAthlete: AuthUser | null;
  setSelectedAthlete: SetState<AuthUser | null>;
  selectedCycles: Cycle[];
  setSelectedCycles: SetState<Cycle[]>;
  selectedTraining: Training | null;
  setSelectedTraining: SetState<Training | null>;
  selectedPercentageCalculation: PercentageCalculation;
  setSelectedPercentageCalculation: SetState<PercentageCalculation>;
}

export default function AthleteExerciseDataGridHeader(props: Props) {
  const { selectedInstitution } = useDashboard();

  const {
    selectedAthlete,
    setSelectedAthlete,
    selectedCycles,
    setSelectedCycles,
    selectedTraining,
    setSelectedTraining,
    selectedPercentageCalculation,
    setSelectedPercentageCalculation,
  } = props;

  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    if (!selectedInstitution || !selectedAthlete) return;

    setCycles(
      selectedInstitution.groups
        .filter((g) => g.membersIds.includes(selectedAthlete.uid))
        .flatMap((g) => g.cycles)
    );
  }, [selectedAthlete]);

  const {
    athleteAnchorElRef,
    cyclesAnchorElRef,
    trainingAnchorElRef,
    percentageCalculationAnchorElRef,
    openSelectAthleteMenu,
    setOpenAthleteMenu,
    filteredAthletes,
    possibleTrainings,
    searchAthlete,
    setSearchAthlete,
  } = useAthleteExerciseReportDataGridHeader(
    selectedAthlete,
    cycles,
    selectedCycles,
    setSelectedCycles,
    setSelectedTraining
  );

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="flex-start"
      alignItems="center"
      gap={2}
    >
      <UserSelect
        anchorElRef={athleteAnchorElRef}
        open={openSelectAthleteMenu}
        src={selectedAthlete?.photoURL || USER_AVATAR_IMG_URL}
        onAvatarClick={() => {
          setOpenAthleteMenu((prev) => !prev);
        }}
      />

      <Menu
        anchorEl={athleteAnchorElRef.current}
        open={openSelectAthleteMenu}
        onClose={() => {
          setOpenAthleteMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          top: 50,
        }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          <SearchBar
            placeholder="Search Athletes"
            value={searchAthlete}
            handleSearchChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearchAthlete(e.target.value);
            }}
            maxWidth="100%"
            sx={{
              width: 140,
            }}
          />

          {/* Athlete list */}
          <Box
            display="flex"
            flexDirection="column"
            maxHeight={300}
            sx={{ overflowY: 'auto' }}
          >
            {filteredAthletes
              .sort((a, b) =>
                (a.displayName || '').localeCompare(b.displayName || '')
              )
              .map((athlete) => {
                const isSelected = selectedAthlete?.uid === athlete.uid;

                return (
                  <MenuItem
                    key={athlete.uid}
                    onClick={() => {
                      if (isSelected) {
                        setOpenAthleteMenu(false);
                        return;
                      }

                      setSelectedAthlete(athlete);
                      setOpenAthleteMenu(false);
                    }}
                  >
                    <Box
                      key={athlete.uid}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                      }}
                    >
                      <Avatar
                        src={athlete.photoURL || USER_AVATAR_IMG_URL}
                        sx={{
                          width: 30,
                          height: 30,
                          border: isSelected
                            ? `2px solid ${theme.palette.primary.main}`
                            : 'none',
                          borderRadius: '50%',
                        }}
                      />
                      <Typography>{athlete.displayName}</Typography>
                    </Box>
                  </MenuItem>
                );
              })}
          </Box>
        </Box>
      </Menu>

      <Typography
        fontWeight={600}
        fontSize={16}
        textAlign="center"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          cursor: 'pointer',
        }}
        onClick={() => {
          setOpenAthleteMenu((prev) => !prev);
        }}
      >
        {selectedAthlete?.displayName || 'Select an athlete'}
      </Typography>

      <FormControl sx={{ width: 200 }} size="small">
        <InputLabel id="cycles-label">Cycles</InputLabel>
        <Select
          labelId="cycles-label"
          ref={cyclesAnchorElRef}
          multiple
          value={selectedCycles.map((c) => c.id)}
          displayEmpty
          renderValue={(selected) => {
            if (!Array.isArray(selected) || selected.length === 0) {
              return (
                <Typography
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Cycles
                </Typography>
              );
            }

            const names = selected
              .map((id) => cycles.find((c) => c.id === id)?.name ?? '')
              .filter(Boolean);

            return (
              <Typography
                sx={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {names.join(', ')}
              </Typography>
            );
          }}
          onChange={(e) => {
            const value = e.target.value as string[];

            const newSelected =
              cycles.filter((c) => value.includes(c.id)) ?? [];

            setSelectedCycles(newSelected);
          }}
        >
          {!cycles || !cycles.length ? (
            <MenuItem disabled>
              <Typography sx={{ px: 1 }}>No cycles</Typography>
            </MenuItem>
          ) : (
            cycles
              .sort(
                (a, b) =>
                  new Date(b.from).getTime() - new Date(a.from).getTime()
              )
              .map((cycle: Cycle) => (
                <MenuItem key={cycle.id} value={cycle.id}>
                  <Typography>{cycle.name}</Typography>
                </MenuItem>
              ))
          )}
        </Select>
      </FormControl>

      <FormControl sx={{ width: 200 }} size="small">
        <InputLabel id="training-label">Session</InputLabel>
        <Select
          ref={trainingAnchorElRef}
          labelId="training-label"
          value={selectedTraining ? selectedTraining.id : ''}
          displayEmpty
          renderValue={(_) => {
            if (!selectedTraining) return;

            return (
              <Typography
                sx={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {dayjs(selectedTraining.from).format('DD-MMM-A')}
              </Typography>
            );
          }}
          onChange={(e) => {
            const value = e.target.value;
            const training =
              possibleTrainings.find((t) => t.id === value) || null;

            setSelectedTraining(training);
          }}
        >
          {!possibleTrainings.length ? (
            <Typography sx={{ px: 1 }}>No sessions</Typography>
          ) : (
            possibleTrainings
              .sort(
                (a, b) =>
                  new Date(b.from).getTime() - new Date(a.from).getTime()
              )
              .map((training: Training) => {
                return (
                  <MenuItem key={training.id} value={training.id}>
                    <Typography>
                      {dayjs(training.from).format('DD-MMM-A')}
                    </Typography>
                  </MenuItem>
                );
              })
          )}
        </Select>
      </FormControl>
      <FormControl sx={{ width: 200 }} size="small">
        <InputLabel id="percentage-calculation-label">
          Show % based on
        </InputLabel>
        <Select
          ref={percentageCalculationAnchorElRef}
          labelId="percentage-calculation-label"
          value={selectedPercentageCalculation}
          displayEmpty
          renderValue={(_) => {
            return (
              <Typography
                sx={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedPercentageCalculation}
              </Typography>
            );
          }}
          onChange={(e) => {
            const value = e.target.value as PercentageCalculation;
            setSelectedPercentageCalculation(value);
          }}
        >
          {Object.values(PercentageCalculation).map((calculation) => {
            return (
              <MenuItem key={calculation} value={calculation}>
                <Typography>{calculation}</Typography>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
