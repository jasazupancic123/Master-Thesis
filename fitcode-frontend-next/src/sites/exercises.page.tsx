'use client';

import { Publish } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/AddOutlined';
import {
  Grid2,
  Pagination,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  handleAddExercise,
  handleDeleteExercise,
  handleExerciseCsvFileUpload,
  handleMuscleValuesCsvFileUpload,
  handlePaginateExercises,
  handleUpdateExercise,
  handleUpsertManyExercises,
  handleUpsertMuscleValues,
} from '@/app/(trainer)/dashboard/exercises/state';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { isAdmin, isManager } from '@/common/firebase/firebase-auth.util';
import type { Pagination as PaginationType } from '@/common/type/paginate.type';
import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import ExerciseModal from '@/components/exercise-modal/exercise-modal';
import ExerciseFilter from '@/components/exercises-list/exercise-filter';
import ExercisesList from '@/components/exercises-list/exercises-list';
import FileUpload from '@/components/file-upload/file-upload';
import MyModal from '@/components/modal/modal';
import { SearchBar } from '@/components/search-bar/search-bar';
import { ComponentService } from '@/controller/component/component.service';
import type { Component } from '@/controller/component/type/component.type';
import type {
  CreateExerciseMuscleValues,
  Exercise,
} from '@/controller/exercise/type/exercise.type';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';

type AttributeValue =
  | string
  | number
  | boolean
  | [number, number] // range
  | Set<string>; // select/multiselect

export type AttributeFilters = Record<string, AttributeValue | undefined>;

export const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentIds: [],
  isUnilateral: false,
};

export const EXERCISES_PAGE_SIZE = 20;

export default function ExercisesPage() {
  const { token, role } = useAuthenticatedAuth();
  const {
    components,
    exercises: allExercises,
    setExercises: setAllExercises,
  } = useMain();

  const router = useRouter();
  const theme = useTheme();
  const screenSize = useScreenSize();

  // filter exercises
  const [filters, setFilters] = useState<AttributeFilters>({});
  const [selectedComponent, setSelectedComponent] =
    useState<Component | null>();

  const [exercises, setExercises] = useState<Exercise[]>(allExercises);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: EXERCISES_PAGE_SIZE,
    pages: 1,
    total: 0,
  });

  // modals
  const [exercise, setExercise] = useState<Partial<Exercise>>(DEFAULT_EXERCISE);
  const [importedExercises, setImportedExercises] = useState<Exercise[]>([]);
  const [importedMuscleValueExercises, setImportedMuscleValueExercises] =
    useState<CreateExerciseMuscleValues[]>([]);

  const [openFilters, setOpenFilters] = useState(false);
  const [modal, setModal] = useState({
    add: false,
    edit: false,
    import: false,
    muscleValues: false,
    confirmDelete: false,
  });

  const actions = [
    {
      icon: <AddIcon />,
      name: 'Create Exercise',
      onClick: () => {
        setModal((prev) => ({ ...prev, add: true }));
        setExercise(DEFAULT_EXERCISE);
      },
    },
    {
      icon: <Publish />,
      name: 'Import Exercises',
      onClick: () => setModal((prev) => ({ ...prev, import: true })),
    },
    {
      icon: <Publish />,
      name: 'Import Muscle Values',
      onClick: () => setModal((prev) => ({ ...prev, muscleValues: true })),
    },
  ];

  /**
   * Filter exercises
   */
  useEffect(() => {
    const filter: Partial<Exercise> = {
      ...(selectedComponent?.id && { componentIds: [selectedComponent.id] }),
      ...(search && { name: search }),
      ...filters,
    };

    handlePaginateExercises(filter, {
      components,
      exercises,
      pagination,
      search,
      setPagination,
      setFilteredExercises,
    });
  }, [
    components,
    exercises.length,
    selectedComponent,
    filters,
    search,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <Box p={2} px={screenSize.isMobile ? 0 : undefined}>
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
        my={2}
        borderRadius={2}
        pb={1}
        bgcolor={theme.palette.background.default}
      >
        <ExerciseChips
          noSelectionLabel="All"
          components={ComponentService.toTree(
            components.filter((c) => c.id !== WARMUP_ID && c.id !== COOLDOWN_ID)
          )}
          selected={selectedComponent}
          setSelected={(component) =>
            setSelectedComponent(component as Component)
          }
          bgColor={theme.palette.background.default}
          primaryColor={theme.palette.primary.main}
          gap={screenSize.isReallySmall ? 1.5 : 3.5}
        />
      </Box>

      <Box
        sx={{ py: 2, width: '50%', minWidth: 240, maxWidth: 400, mx: 'auto' }}
      >
        <SearchBar
          placeholder="Search Exercises"
          value={search}
          handleSearchChange={(e) => setSearch(e.target.value)}
          maxWidth="100%"
        />
      </Box>

      <Grid2 container alignItems="center" spacing={2} sx={{ m: 2 }}>
        {/* Left empty space (desktop only) */}
        <Grid2
          size={{ xs: screenSize.isMobile ? 6 : 4 }}
          container
          order={1}
          justifyContent={{ xs: 'flex-end', md: 'flex-start' }}
          alignItems="center"
        >
          {(isAdmin(role) || isManager(role)) && (
            <Box position="relative">
              <SpeedDial
                ariaLabel="Exercise Actions"
                icon={<SpeedDialIcon />}
                direction={screenSize.isMobile ? 'left' : 'right'}
                FabProps={{ size: 'small', color: 'primary' }}
                sx={{
                  '& .MuiSpeedDial-fab': {
                    width: 40,
                    height: 40,
                    minHeight: 0,
                  },
                  '& .MuiSpeedDialAction-fab': {
                    width: 32,
                    height: 32,
                    minHeight: 0,
                  },
                }}
              >
                {actions.map((action) => (
                  <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    onClick={action.onClick}
                    slotProps={{
                      tooltip: { title: action.name },
                      fab: { size: 'small', color: 'primary' },
                    }}
                    sx={{ bgcolor: theme.palette.primary.main }}
                  />
                ))}
              </SpeedDial>
            </Box>
          )}
        </Grid2>

        {/* Pagination */}
        <Grid2
          size={{ xs: screenSize.isMobile ? 12 : 4 }}
          container
          justifyContent="center"
          order={screenSize.isMobile ? 3 : 2}
        >
          <Pagination
            size="small"
            count={pagination.pages}
            color="primary"
            page={pagination.page}
            onChange={(_, page) => setPagination({ ...pagination, page })}
          />
        </Grid2>

        {/* Filters & Results */}
        <Grid2
          order={screenSize.isMobile ? 2 : 3}
          size={{ xs: screenSize.isMobile ? 6 : 4 }}
          container
          justifyContent={screenSize.isMobile ? 'flex-start' : 'flex-end'}
          alignItems="center"
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {!screenSize.isMobile && (
              <Typography variant="body2" color="text.primary">
                {pagination.total} results
              </Typography>
            )}

            <ExerciseFilter
              filters={filters}
              setFilters={setFilters}
              open={openFilters}
              setOpen={setOpenFilters}
            />
          </Box>
        </Grid2>
      </Grid2>

      <ExercisesList
        exercises={filteredExercises}
        setExercise={setExercise}
        setModal={setModal}
      />

      {/* Add Exercise Modal*/}
      {modal.add && (
        <ExerciseModal
          data={{ ...exercise, imageUrl: undefined, videoUrl: undefined }}
          setData={setExercise}
          components={components}
          isOpen={modal.add}
          setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
          title={'Add Exercise'}
          onConfirm={async () => {
            handleAddExercise(token, exercise, {
              router,
              components,
              component: selectedComponent!,
              filteredExercises,
              setFilteredExercises,
              setExercises: setAllExercises,
              setExercise,
              setModal,
            });
          }}
        />
      )}

      {/* Edit Exercise Modal */}
      {modal.edit && (
        <ExerciseModal
          data={exercise}
          setData={setExercise}
          components={components}
          isOpen={modal.edit}
          setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
          title={
            exercise.ownerId === 'global' && role !== UserRole.ADMIN
              ? 'Exercise Details'
              : 'Update Exercise'
          }
          {...((exercise.ownerId !== 'global' || role === UserRole.ADMIN) && {
            onConfirm: async () => {
              handleUpdateExercise(token, exercise!.id!, exercise, {
                router,
                components,
                setFilteredExercises,
                setExercises: setAllExercises,
                setExercise,
                setModal,
              });
            },
            onDelete: () => {
              setModal((prev) => ({ ...prev, confirmDelete: true }));
            },
            cancelText: 'Delete',
          })}
        />
      )}

      <MyModal
        isOpen={modal.confirmDelete}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, confirmDelete: open }))
        }
        cancelText="Cancel"
        onCancel={() => setModal((prev) => ({ ...prev, confirmDelete: false }))}
        onConfirm={async () => {
          await handleDeleteExercise(token, exercise!.id!, {
            router,
            setFilteredExercises,
            setExercises: setAllExercises,
          });
          setModal((prev) => ({ ...prev, confirmDelete: false }));
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Delete exercise?
        </Typography>
      </MyModal>

      <MyModal
        isOpen={modal.import}
        setIsOpen={(open) => setModal((prev) => ({ ...prev, import: open }))}
        width={screenSize.isMobile ? undefined : 500}
        onConfirm={() => {
          handleUpsertManyExercises(
            token,
            { exercises: importedExercises },
            { router, setAllExercises, setExercises, setFilteredExercises }
          );

          setModal((prev) => ({ ...prev, import: false }));
        }}
      >
        <FileUpload
          label="Exercises"
          input="csv"
          onFileUpload={async (file) => {
            handleExerciseCsvFileUpload(file, { setImportedExercises });
          }}
        />
      </MyModal>

      <MyModal
        isOpen={modal.muscleValues}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, muscleValues: open }))
        }
        width={screenSize.isMobile ? undefined : 500}
        onConfirm={() => {
          handleUpsertMuscleValues(
            token,
            {
              exercises: importedMuscleValueExercises.map(
                (muscleValuesExercise) => ({
                  name: muscleValuesExercise.name,
                  muscleValues: muscleValuesExercise.muscleValues,
                })
              ),
            },
            { router, setExercises: setAllExercises }
          );

          setModal((prev) => ({ ...prev, muscleValues: false }));
        }}
      >
        <FileUpload
          label="Muscle Values"
          input="csv"
          onFileUpload={async (file) => {
            handleMuscleValuesCsvFileUpload(file, exercises, {
              setImportedMuscleValueExercises,
            });
          }}
        />
      </MyModal>
    </Box>
  );
}
