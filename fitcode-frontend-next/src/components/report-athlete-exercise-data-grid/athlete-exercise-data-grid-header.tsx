import { theme } from '@/app/style';
import { AuthUser } from '@/core/auth/type/user.type';
import { Cycle } from '@/core/group/type/cycle.type';
import { Group } from '@/core/group/type/group.type';
import { Training } from '@/core/training/type/training.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
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
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  selectedAthlete: AuthUser | null;
  setSelectedAthlete: SetState<AuthUser | null>;
  group: Group | null;
  setGroup: SetState<Group | null>;
  selectedCycles: Cycle[];
  setSelectedCycles: SetState<Cycle[]>;
  selectedTraining: Training | null;
  setSelectedTraining: SetState<Training | null>;
}

export default function AthleteExerciseDataGridHeader(props: Props) {
  const { selectedInstitution, trainings } = useDashboard();

  const {
    selectedAthlete,
    setSelectedAthlete,
    group,
    setGroup,
    selectedCycles,
    setSelectedCycles,
    selectedTraining,
    setSelectedTraining,
  } = props;

  const [searchAthlete, setSearchAthlete] = useState('');
  const [openSelectAthleteMenu, setOpenAthleteMenu] = useState(false);

  const [possibleTrainings, setPossibleTrainings] = useState<Training[]>([]);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const cyclesAnchorElRef = useRef<HTMLElement | null>(null);
  const trainingAnchorElRef = useRef<HTMLElement | null>(null);

  const filteredAthletes = useMemo<AuthUser[]>(() => {
    const allAthletes = selectedInstitution?.athletes || [];
    if (searchAthlete.trim() === '') return allAthletes;

    const lowerSearch = searchAthlete.toLowerCase();

    return allAthletes.filter((athlete) =>
      athlete.displayName?.toLowerCase().includes(lowerSearch)
    );
  }, [selectedInstitution, searchAthlete]);

  useEffect(() => {
    if (!selectedAthlete) return;

    const athleteGroup = selectedInstitution?.groups.find((g) =>
      g.membersIds.includes(selectedAthlete.uid)
    );

    setGroup(athleteGroup || null);
  }, [selectedAthlete]);

  useEffect(() => {
    if (!group) {
      setSelectedCycles([]);
      return;
    }

    if (!group.cycles || !group.cycles.length) {
      setSelectedCycles([]);
      return;
    }

    setSelectedCycles([
      group.cycles.sort(
        (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
      )[0],
    ]);
  }, [group]);

  useEffect(() => {
    if (!selectedAthlete) return;

    const newPossibleTrainings = trainings
      .filter(
        (t) =>
          selectedCycles.some((c) => c.id === t.cycleId) &&
          t.membersIds.includes(selectedAthlete.uid)
      )
      .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

    setPossibleTrainings(() => newPossibleTrainings);
    setSelectedTraining(newPossibleTrainings[0] || null);
  }, [selectedCycles]);

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
              .map((id) => group?.cycles?.find((c) => c.id === id)?.name ?? '')
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
              group?.cycles?.filter((c) => value.includes(c.id)) ?? [];

            setSelectedCycles(newSelected);
          }}
        >
          {!group?.cycles || !group?.cycles.length ? (
            <MenuItem disabled>
              <Typography sx={{ px: 1 }}>No cycles</Typography>
            </MenuItem>
          ) : (
            group.cycles
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
                {dayjs(selectedTraining.from).format('YYYY-MM-DD-A')}
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
                      {dayjs(training.from).format('YYYY-MM-DD-A')}
                    </Typography>
                  </MenuItem>
                );
              })
          )}
        </Select>
      </FormControl>
    </Box>
  );
}
