'use client';

import { Publish } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Pagination, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
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
import { isAdmin } from '@/common/firebase/firebase-auth.util';
import type { Pagination as PaginationType } from '@/common/type/paginate.type';
import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import ExerciseModal from '@/components/exercise-modal/exercise-modal';
import ExercisesList from '@/components/exercises-list/exercises-list';
import FileUpload from '@/components/file-upload/file-upload';
import MyModal from '@/components/modal/modal';
import PageTitle from '@/components/page-title/page-title';
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

export const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentIds: [],
  isUnilateral: false,
  valuesObject: {},
};

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
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );

  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    setExercises([...allExercises.filter((e) => !e.deletedAt)]);
  }, [allExercises]);

  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 10,
    pages: 1,
    total: 0,
  });

  // modals
  const [exercise, setExercise] = useState<Partial<Exercise>>(DEFAULT_EXERCISE);
  const [importedExercises, setImportedExercises] = useState<Exercise[]>([]);
  const [importedMuscleValueExercises, setImportedMuscleValueExercises] =
    useState<CreateExerciseMuscleValues[]>([]);
  const [modal, setModal] = useState({
    add: false,
    edit: false,
    import: false,
    muscleValues: false,
    confirmDelete: false,
  });

  /**
   * Filter exercises
   */
  useEffect(() => {
    handlePaginateExercises(
      {
        ...(selectedComponent?.id && {
          componentsIds: [selectedComponent.id],
        }),
        ...(search && { name: search }),
      },
      {
        components,
        exercises,
        pagination,
        setPagination,
        setFilteredExercises,
      }
    );
  }, [
    components,
    search,
    exercises.length,
    selectedComponent,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <Box p={2} px={screenSize.isMobile ? 0 : undefined}>
      {/* Import Button */}
      {role && isAdmin(role) && (
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={4}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{
              cursor: 'pointer',
            }}
            onClick={() => {
              setModal({ ...modal, import: true });
            }}
          >
            <IconButton>
              <Publish />
            </IconButton>
            <Typography>Import Exercises</Typography>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={1}
            onClick={() => {
              setModal({ ...modal, muscleValues: true });
            }}
            sx={{
              cursor: 'pointer',
            }}
          >
            <IconButton>
              <Publish />
            </IconButton>
            <Typography>Import Muscle Values</Typography>
          </Box>
        </Box>
      )}
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
        <Box pb={1}>
          <PageTitle title="Exercises" />
        </Box>

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

        {/* Search Input */}
        <Box sx={{ py: 2 }}>
          <SearchBar
            placeholder="Search Exercises"
            value={search}
            handleSearchChange={(e) => setSearch(e.target.value)}
            maxWidth="100%"
          />
        </Box>

        <Stack direction="row">
          {/* Add Button */}
          <Tooltip title="Create">
            <IconButton
              onClick={() => {
                setModal({ ...modal, add: true });
                setExercise(DEFAULT_EXERCISE);
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      <Stack direction="row" justifyContent="center" my={2} width="100%">
        <Pagination
          count={pagination.pages}
          color="primary"
          onChange={(_, page) => setPagination({ ...pagination, page })}
          page={pagination.page}
        />
      </Stack>
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
          onConfirm={async (attributes) => {
            handleAddExercise(token, exercise, {
              router,
              components,
              attributes,
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
          data={{
            ...exercise,
            /* valuesObject: commonService.object.flattenObject(
                ExerciseService.attributeValuesToNestedObject(
                  exercise.attributeValues || []
                )
              ), */
          }}
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
            onConfirm: async (attributes) => {
              handleUpdateExercise(token, exercise!.id!, exercise, {
                router,
                components,
                attributes,
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
            {
              exercises: importedExercises.map((exercise) => ({
                name: exercise.name,
                componentIds: exercise.componentIds,
                isUnilateral: exercise.isUnilateral,
                imageUrl: exercise.imageUrl,
                videoUrl: exercise.videoUrl,
                instruction: exercise.instruction,
                categories: [],
                equipment: [],
                prescriptions: [],
                patterns: [],
                bodyRegions: [],
                loadingSides: [],
                movementDirections: [],
                locations: [],
                liftPriorities: [],
              })),
            },
            { router, setExercises: setAllExercises }
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
