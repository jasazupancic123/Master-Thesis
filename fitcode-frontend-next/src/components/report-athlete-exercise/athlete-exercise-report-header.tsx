import {
  Groups,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { updateReportInIndexDb } from './actions/actions-index-db';
import useAthleteExerciseReportAthletes from './hooks/use-athletes';
import useAthleteExerciseReportData from './hooks/use-data';
import useAthleteExerciseReportExercises from './hooks/use-exercises';
import type { IndexDbAthleteExerciseReport } from './types/index-db-athlete-exercise-report';
import { theme } from '@/app/style';
import type { Workload } from '@/core/training/type/workload.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { SetState } from '@/lib/common/type/state.type';
import { SearchBar } from '@/ui/search-bar/search-bar';
import { useDashboard } from '@/store/dashboard.provider';
import UserSelect from '@/ui/user-select';

interface Props {
  id: string;
  reportType: 'single' | 'comparison';
  setData: SetState<Workload[]>;
  cache: Map<string, Workload[]>;
  passedUserId?: string;
  passedUserIds?: string[];
  passedExerciseId?: string;
}

export default function AthleteExerciseReportHeader(props: Props) {
  const { selectedInstitution } = useDashboard();

  const {
    id,
    reportType,
    setData,
    cache,
    passedUserId,
    passedUserIds,
    passedExerciseId,
  } = props;

  const {
    selectedAthlete,
    setSelectedAthlete,
    selectedAthletes,
    setSelectedAthletes,
    filteredAthletes,
    searchAthleteText,
    setSearchAthleteText,
  } = useAthleteExerciseReportAthletes(passedUserId, passedUserIds);

  const {
    exercisesToSelect,
    selectedExercise,
    setSelectedExercise,
    filteredExercises,
    searchExercisesText,
    setSearchExercisesText,
  } = useAthleteExerciseReportExercises(selectedAthlete, passedExerciseId);

  useAthleteExerciseReportData(
    reportType,
    selectedAthlete,
    selectedAthletes,
    selectedExercise,
    cache,
    setData
  );

  const [openSelectAthleteMenu, setOpenSelectAthleteMenu] = useState(false);
  const [openSelectExerciseMenu, setOpenSelectExerciseMenu] = useState(false);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const exerciseAnchorElRef = useRef<HTMLElement | null>(null);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        sx={{
          p: 1,
        }}
        gap={2}
      >
        <UserSelect
          anchorElRef={athleteAnchorElRef}
          open={openSelectAthleteMenu}
          src={
            reportType === 'single' && selectedAthlete
              ? selectedAthlete?.photoURL || USER_AVATAR_IMG_URL
              : undefined
          }
          icon={
            reportType === 'comparison' ? (
              <Groups sx={{ fontSize: 36 }} />
            ) : undefined
          }
          onAvatarClick={() => {
            setOpenSelectAthleteMenu((prev) => !prev);
          }}
        />

        <Menu
          anchorEl={athleteAnchorElRef.current}
          open={openSelectAthleteMenu}
          onClose={() => {
            setOpenSelectAthleteMenu(false);
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
              value={searchAthleteText}
              handleSearchChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchAthleteText(e.target.value);
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
                  const isSelected =
                    (reportType === 'comparison' &&
                      selectedAthletes.some((a) => a.uid === athlete.uid)) ||
                    (reportType === 'single' &&
                      selectedAthlete?.uid === athlete.uid);

                  return (
                    <MenuItem
                      key={athlete.uid}
                      onClick={async () => {
                        if (!selectedExercise || !selectedInstitution) return;

                        if (reportType === 'comparison') {
                          const isAlreadySelected = selectedAthletes.some(
                            (a) => a.uid === athlete.uid
                          );

                          let newAthletes = [...selectedAthletes];

                          if (isAlreadySelected)
                            newAthletes = newAthletes.filter(
                              (a) => a.uid !== athlete.uid
                            );
                          else if (selectedAthletes.length >= 5) {
                            toast.error(
                              'You can select up to 5 athletes for comparison.'
                            );
                            return;
                          } else newAthletes.push(athlete);

                          const item: IndexDbAthleteExerciseReport = {
                            id,
                            exerciseId: selectedExercise.id,
                            institutionId: selectedInstitution.id,
                            userIds: newAthletes.map((a) => a.uid),
                          };

                          await updateReportInIndexDb(item);

                          setSelectedAthletes(newAthletes);
                        } else {
                          const item: IndexDbAthleteExerciseReport = {
                            id,
                            exerciseId: selectedExercise.id,
                            institutionId: selectedInstitution.id,
                            userId: athlete.uid,
                          };

                          await updateReportInIndexDb(item);

                          setSelectedAthlete(athlete);
                          setOpenSelectAthleteMenu(false);
                        }
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

        <Box
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Typography
            maxWidth={230}
            fontWeight={600}
            fontSize={16}
            textAlign="center"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {reportType === 'single'
              ? selectedAthlete?.displayName || 'Select an athlete'
              : `${
                  selectedAthletes
                    .map((a) => a.displayName?.split(' ')[0])
                    .join(', ') || 'Select athletes'
                }`}
          </Typography>
          <Box
            ref={exerciseAnchorElRef}
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={0.5}
            sx={{
              '&:hover': {
                cursor: 'pointer',
                backgroundColor: alpha(theme.palette.background.dark, 0.9),
              },
            }}
            onClick={() => {
              setOpenSelectExerciseMenu((prev) => !prev);
            }}
          >
            <Typography
              fontSize={14}
              textAlign="center"
              sx={{
                userSelect: 'none',
              }}
            >
              {selectedExercise?.name || 'Select an exercise'}
            </Typography>
            <IconButton
              sx={{
                p: 0.25,
                m: 0,
                backgroundColor: theme.palette.background.default,
                borderRadius: '50%',
              }}
            >
              {openSelectExerciseMenu ? (
                <KeyboardArrowUpOutlined sx={{ fontSize: 16 }} />
              ) : (
                <KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={exerciseAnchorElRef.current}
        open={openSelectExerciseMenu}
        onClose={() => {
          setOpenSelectExerciseMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ top: 24 }}
      >
        {exercisesToSelect.length === 0 ? (
          <Typography sx={{ px: 1 }}>No exercises found</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            <SearchBar
              placeholder="Search Exercises"
              value={searchExercisesText}
              handleSearchChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchExercisesText(e.target.value);
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
              {filteredExercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((exercise) => (
                  <MenuItem
                    key={exercise.id}
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setOpenSelectExerciseMenu(false);
                    }}
                  >
                    <Box
                      key={exercise.id}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                      }}
                    >
                      <Typography>{exercise.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Box>
          </Box>
        )}
      </Menu>
    </Box>
  );
}
