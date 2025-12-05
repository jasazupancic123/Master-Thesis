'use client';

import { FitnessCenter, Group, Groups } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import useTrainingRecapColumns from './hooks/use-columns';
import useTrainingRecapRows from './hooks/use-rows';
import useTrainingRecapRowsActions from './hooks/use-rows-actions';
import useTrainingRecapSelectedAthletes from './hooks/use-selected-athletes';
import useTrainingRecapSelectedExercises from './hooks/use-selected-exercises';
import SelectedWorkloadModal from './modals/selected-workload.modal';
import TrainingRecapHeader from './training-recap-header';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Workload } from '@/core/training/type/workload.type';
import {
  EXERCISE_DEFAULT_IMG_URL,
  USER_AVATAR_IMG_URL,
} from '@/lib/common/const/image.const';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainingRecap } from '@/store/training-recap.provider';
import { SearchBar } from '@/ui/search-bar/search-bar';
import UserSelect from '@/ui/user-select';

export default function TrainingRecap() {
  const screenSize = useScreenSize();

  const { submitWorkloads } = useTrainingRecap();

  const [openSelectedWorkloadModal, setOpenSelectedWorkloadModal] =
    useState(false);
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(
    null
  );
  const [openSelectAthleteMenu, setOpenSelectAthleteMenu] = useState(false);
  const [openSelectExerciseMenu, setOpenSelectExerciseMenu] = useState(false);

  const [deletedWorkloads, setDeletedWorkloads] = useState<Workload[]>([]);
  const [updatedWorkloads, setUpdatedWorkloads] = useState<Workload[]>([]);

  const athleteAnchorElRef = useRef<HTMLElement | null>(null);
  const exerciseAnchorElRef = useRef<HTMLElement | null>(null);

  const [selectedAthletes, setSelectedAthletes] = useState<AuthUser[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const { filteredAthletes, searchAthlete, setSearchAthlete } =
    useTrainingRecapSelectedAthletes();

  const { filteredExercises, searchExercise, setSearchExercise } =
    useTrainingRecapSelectedExercises();

  const { rows, setRows } = useTrainingRecapRows(
    selectedAthletes,
    selectedExercises
  );

  const {
    rowModesModel,
    setRowModesModel,
    rowSelectionModel,
    setRowSelectionModel,
    handleRowEditStop,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    processRowUpdate,
  } = useTrainingRecapRowsActions(rows, setRows, setDeletedWorkloads);

  const { columns } = useTrainingRecapColumns(
    rowModesModel,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    setSelectedWorkload,
    setOpenSelectedWorkloadModal
  );

  const isSmallSize = screenSize.isMobile;

  return (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      pb={2}
      sx={{
        mx: 'auto',
        px: 1,
      }}
    >
      <TrainingRecapHeader />
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="space-between"
        justifyContent="flex-start"
        gap={2}
      >
        <Box
          display="flex"
          flexDirection={isSmallSize ? 'column' : 'row'}
          justifyContent="flex-start"
          alignItems={isSmallSize ? 'flex-start' : 'center'}
          gap={2}
        >
          <Box
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
          >
            <UserSelect
              anchorElRef={athleteAnchorElRef}
              open={openSelectAthleteMenu}
              src={
                selectedAthletes.length === 1
                  ? selectedAthletes[0]?.photoURL || USER_AVATAR_IMG_URL
                  : undefined
              }
              icon={
                selectedAthletes.length !== 1 ? (
                  <Groups sx={{ fontSize: 36 }} />
                ) : undefined
              }
              onAvatarClick={() => {
                setOpenSelectAthleteMenu((prev) => !prev);
              }}
            />
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-evenly"
            >
              <Typography
                sx={{
                  maxWidth:
                    typeof window !== 'undefined'
                      ? Math.min(
                          isSmallSize
                            ? window.innerWidth * 0.8
                            : window.innerWidth * 0.3,
                          400
                        )
                      : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedAthletes.length === 0
                  ? 'Filter Athletes'
                  : selectedAthletes
                      .map((a) => a.displayName || 'Unknown User')
                      .join(', ')}
              </Typography>
              <Box display="flex" gap={0.5} alignItems="center">
                <Group fontSize="small" />
                <Typography variant="caption">
                  {selectedAthletes.length} selected
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
          >
            <UserSelect
              anchorElRef={exerciseAnchorElRef}
              open={openSelectExerciseMenu}
              src={
                selectedExercises.length === 1
                  ? selectedExercises[0]?.imageUrl || EXERCISE_DEFAULT_IMG_URL
                  : undefined
              }
              icon={<FitnessCenter />}
              onAvatarClick={() => {
                setOpenSelectExerciseMenu((prev) => !prev);
              }}
            />
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-evenly"
            >
              <Typography
                sx={{
                  maxWidth:
                    typeof window !== 'undefined'
                      ? Math.min(
                          isSmallSize
                            ? window.innerWidth * 0.8
                            : window.innerWidth * 0.3,
                          400
                        )
                      : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedExercises.length === 0
                  ? 'Filter Exercises'
                  : selectedExercises
                      .map((a) => a.name || 'Unknown Exercise')
                      .join(', ')}
              </Typography>
              <Box display="flex" gap={0.5} alignItems="center">
                <FitnessCenter fontSize="small" />
                <Typography variant="caption">
                  {selectedExercises.length} selected
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ width: '100%' }}>
        {/* Custom Header */}
        <Box
          width="100%"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            px: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            backgroundColor: alpha(theme.palette.background.light, 0.8),
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Workloads
          </Typography>

          <Button
            size="small"
            variant="contained"
            onClick={async () => {
              await submitWorkloads(deletedWorkloads, updatedWorkloads);
            }}
          >
            Submit Changes
          </Button>
        </Box>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 25]}
          rowHeight={60}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
          }}
          sx={{
            width: '100%',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            '& .MuiDataGrid-cell--editable': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)', // subtle hint
            },
          }}
          // --- editing via model props ---
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          processRowUpdate={(row) => processRowUpdate(row, setUpdatedWorkloads)}
          onRowEditStop={handleRowEditStop}
          // --- deletion via selection model ---
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
        />
      </Box>

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
            value={searchAthlete}
            handleSearchChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearchAthlete(e.target.value);
            }}
            maxWidth="100%"
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
                const isSelected = selectedAthletes.some(
                  (a) => a.uid === athlete.uid
                );

                return (
                  <MenuItem
                    key={athlete.uid}
                    onClick={async () => {
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

                      setSelectedAthletes(newAthletes);
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
        sx={{
          top: 50,
        }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          <SearchBar
            placeholder="Search Exercises"
            value={searchExercise}
            handleSearchChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSearchExercise(e.target.value);
            }}
            maxWidth="100%"
          />

          {/* Athlete list */}
          <Box
            display="flex"
            flexDirection="column"
            maxHeight={300}
            sx={{ overflowY: 'auto' }}
          >
            {filteredExercises
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              .map((exercise) => {
                const isSelected = selectedExercises.some(
                  (a) => a.id === exercise.id
                );

                return (
                  <MenuItem
                    key={exercise.id}
                    onClick={async () => {
                      const isAlreadySelected = selectedExercises.some(
                        (e) => e.id === exercise.id
                      );

                      let newExercises = [...selectedExercises];

                      if (isAlreadySelected)
                        newExercises = newExercises.filter(
                          (e) => e.id !== exercise.id
                        );
                      else newExercises.push(exercise);

                      setSelectedExercises(newExercises);
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
                      <Avatar
                        src={exercise.imageUrl || EXERCISE_DEFAULT_IMG_URL}
                        sx={{
                          width: 30,
                          height: 30,
                          border: isSelected
                            ? `2px solid ${theme.palette.primary.main}`
                            : 'none',
                          borderRadius: '50%',
                        }}
                      />
                      <Typography>{exercise.name}</Typography>
                    </Box>
                  </MenuItem>
                );
              })}
          </Box>
        </Box>
      </Menu>

      <SelectedWorkloadModal
        open={openSelectedWorkloadModal}
        setOpen={setOpenSelectedWorkloadModal}
        workload={selectedWorkload}
      />
    </Box>
  );
}
