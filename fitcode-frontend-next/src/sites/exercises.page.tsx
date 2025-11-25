'use client';

import { Download, Publish } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/AddOutlined';
import {
  Button,
  Pagination,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import ExerciseModal from '@/components/exercise-modal/exercise-modal';
import ExerciseFilter from '@/components/exercises-list/exercise-filter';
import ExercisesList from '@/components/exercises-list/exercises-list';
import { Components } from '@/core/exercise/constant/components.constant';
import {
  handleAddExercise,
  handleAiPrescriptionsJsonFileUpload,
  handleDeleteExercise,
  handleExerciseCsvFileUpload,
  handleMuscleValuesCsvFileUpload,
  handlePaginateExercises,
  handleUpdateExercise,
  handleUpsertAiPrescriptions,
  handleUpsertManyExercises,
  handleUpsertMuscleValues,
} from '@/core/exercise/exercise-page-state';
import type { Component } from '@/core/exercise/type/component.type';
import type {
  CreateExerciseMuscleValues,
  Exercise,
} from '@/core/exercise/type/exercise.type';
import { EXERCISE_POSES } from '@/core/exercise-ai-prescriptions/const/exercise-poses';
import type { ExerciseAiPrescription } from '@/core/exercise-ai-prescriptions/type/exercise-detection-data';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { InputType } from '@/lib/common/const/input-type.const';
import { LINK_METHODOLOGIES } from '@/lib/common/const/nav.const';
import type { Pagination as PaginationType } from '@/lib/common/type/paginate.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import FileUpload from '@/ui/file-upload';
import MyModal from '@/ui/modal';
import { SearchBar } from '@/ui/search-bar/search-bar';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';

type AttributeValue =
  | string
  | number
  | boolean
  | [number, number] // range
  | Set<string>; // select/multiselect

export type AttributeFilters = Record<string, AttributeValue | undefined>;

export const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  components: [],
  isUnilateral: false,
  disabled: false,
};

export const EXERCISES_PAGE_SIZE = 20;

export type ExercisePageModalState = {
  add: boolean;
  edit: boolean;
  import: boolean;
  muscleValues: boolean;
  importAiPrescriptions: boolean;
  confirmDelete: boolean;
};

export default function ExercisesPage() {
  const { role } = useAuthenticatedAuth();
  const {
    exercises: allExercises,
    setExercises: setAllExercises,
    setExerciseAiPrescriptions,
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
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // modals
  const [exercise, setExercise] = useState<Partial<Exercise>>(DEFAULT_EXERCISE);
  const [importedExercises, setImportedExercises] = useState<Exercise[]>([]);
  const [importedMuscleValueExercises, setImportedMuscleValueExercises] =
    useState<CreateExerciseMuscleValues[]>([]);
  const [importedAiPrescriptions, setImportedAiPrescriptions] = useState<
    ExerciseAiPrescription[]
  >([]);

  const [openFilters, setOpenFilters] = useState(false);
  const [modal, setModal] = useState<ExercisePageModalState>({
    add: false,
    edit: false,
    import: false,
    muscleValues: false,
    importAiPrescriptions: false,
    confirmDelete: false,
  });

  const isSmallSize = screenSize.isMobile || screenSize.isTablet;

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
    lib.firebase.auth.isAdmin(role)
      ? {
          icon: <Publish />,
          name: 'Import Muscle Values',
          onClick: () => setModal((prev) => ({ ...prev, muscleValues: true })),
        }
      : undefined,
    lib.firebase.auth.isAdmin(role)
      ? {
          icon: <Download />,
          name: 'Export Ai Prescriptions',
          onClick: () => {
            lib.common.file.downloadJson(
              EXERCISE_POSES,
              'exercise-ai-prescriptions.json'
            );
          },
        }
      : undefined,
    lib.firebase.auth.isAdmin(role)
      ? {
          icon: <Publish />,
          name: 'Import Ai Prescriptions',
          onClick: () =>
            setModal((prev) => ({ ...prev, importAiPrescriptions: true })),
        }
      : undefined,
  ].filter((s) => s !== undefined);

  /**
   * Filter exercises
   */
  useEffect(() => {
    const allComponentPaths = selectedComponent
      ? lib.common.tree.getNestedPaths(
          selectedComponent.field,
          Components,
          'field',
          'options'
        )
      : [];

    const filter: Partial<Exercise> = {
      ...(selectedComponent?.field && {
        components: allComponentPaths,
      }),
      ...(search && { name: search }),
      ...filters,
    };

    handlePaginateExercises(filter, {
      exercises,
      pagination,
      search,
      setPagination,
      setFilteredExercises,
    });
  }, [
    exercises.length,
    selectedComponent,
    filters,
    search,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  useEffect(() => {
    setExercises(
      allExercises.sort((a, b) => a.name.trim().localeCompare(b.name))
    );
  }, [allExercises]);

  return (
    <Box p={2} pt={0} px={isSmallSize ? 0 : undefined}>
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
          selected={selectedComponent}
          setSelected={(component) =>
            setSelectedComponent(component as Component)
          }
          bgColor={theme.palette.background.default}
          primaryColor={theme.palette.primary.main}
          gap={screenSize.isReallySmall ? 1.5 : 3.5}
          disabledComponents={['other', 'competition']}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        flexDirection={isSmallSize ? 'column-reverse' : 'row'}
        justifyContent="center"
      >
        <Box width="25%" />
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
        <Box
          width={isSmallSize ? '100%' : '25%'}
          display="flex"
          justifyContent={isSmallSize ? 'center' : 'flex-start'}
          alignItems="center"
        >
          <Link href={LINK_METHODOLOGIES.href} passHref>
            <Button variant="outlined" color="primary">
              {LINK_METHODOLOGIES.label}
            </Button>
          </Link>
        </Box>
      </Box>

      <Box
        width="100%"
        display="flex"
        flexDirection={isSmallSize ? 'column' : 'row'}
        alignItems="center"
        sx={{ pb: 1 }}
      >
        <Box
          width={isSmallSize ? '100%' : '25%'}
          display="flex"
          justifyContent={isSmallSize ? 'center' : 'flex-start'}
          alignItems="center"
          gap={isSmallSize ? 1 : 0}
        >
          {(lib.firebase.auth.isAdmin(role) ||
            lib.firebase.auth.isManager(role)) && (
            <SpeedDial
              ariaLabel="Exercise Actions"
              icon={<SpeedDialIcon />}
              direction="right"
              FabProps={{ size: 'small', color: 'primary' }}
              open={speedDialOpen}
              onOpen={() => setSpeedDialOpen(true)}
              onClose={() => setSpeedDialOpen(false)}
              sx={{
                zIndex: 10,
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
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setSpeedDialOpen(false); // close after action
                  }}
                  slotProps={{
                    tooltip: { title: action.name },
                    fab: { size: 'small', color: 'primary' },
                  }}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                  }}
                />
              ))}
            </SpeedDial>
          )}
        </Box>

        <Box
          width={isSmallSize ? '100%' : '50%'}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Pagination
            size="small"
            count={pagination.pages}
            color="primary"
            page={pagination.page}
            onChange={(_, page) => setPagination({ ...pagination, page })}
          />
        </Box>

        <Box
          width={isSmallSize ? '100%' : '25%'}
          display="flex"
          justifyContent={isSmallSize ? 'center' : 'flex-end'}
          alignItems="center"
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
      </Box>

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
          isOpen={modal.add}
          setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
          title={'Add Exercise'}
          onConfirm={async () => {
            handleAddExercise(exercise, {
              router,
              component: selectedComponent!,
              filteredExercises,
              setFilteredExercises,
              setAllExercises,
              setExercises,
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
          isOpen={modal.edit}
          setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
          title={
            exercise.ownerId === 'global' && role !== UserRole.ADMIN
              ? 'Exercise Details'
              : 'Update Exercise'
          }
          {...((exercise.ownerId !== 'global' || role === UserRole.ADMIN) && {
            onConfirm: async () => {
              handleUpdateExercise(exercise!.id!, exercise, {
                router,
                setFilteredExercises,
                setExercises,
                setAllExercises,
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
          await handleDeleteExercise(exercise!.id!, {
            router,
            setFilteredExercises,
            setAllExercises,
            setExercises,
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
        width={isSmallSize ? undefined : 500}
        onConfirm={() => {
          handleUpsertManyExercises(
            { exercises: importedExercises },
            { router, setAllExercises, setExercises, setFilteredExercises }
          );

          setModal((prev) => ({ ...prev, import: false }));
        }}
      >
        <FileUpload
          label="Exercises"
          input={InputType.CSV}
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
        width={isSmallSize ? undefined : 500}
        onConfirm={() => {
          handleUpsertMuscleValues(
            { exercises: importedMuscleValueExercises },
            { router, setExercises: setAllExercises }
          );

          setModal((prev) => ({ ...prev, muscleValues: false }));
        }}
      >
        <FileUpload
          label="Muscle Values"
          input={InputType.CSV}
          onFileUpload={async (file) => {
            handleMuscleValuesCsvFileUpload(file, exercises, {
              setImportedMuscleValueExercises,
            });
          }}
        />
      </MyModal>

      <MyModal
        isOpen={modal.importAiPrescriptions}
        setIsOpen={(open) =>
          setModal((prev) => ({ ...prev, importAiPrescriptions: open }))
        }
        width={isSmallSize ? undefined : 500}
        onConfirm={() => {
          // Handle importing Ai Prescriptions here
          handleUpsertAiPrescriptions(importedAiPrescriptions, {
            router,
            setExerciseAiPrescriptions,
          });

          setModal((prev) => ({ ...prev, importAiPrescriptions: false }));
        }}
      >
        <FileUpload
          label="Ai Prescriptions"
          input={InputType.JSON}
          onFileUpload={async (file) => {
            // update state with imported Ai Prescriptions
            await handleAiPrescriptionsJsonFileUpload(file, {
              setImportedAiPrescriptions,
            });
          }}
        />
      </MyModal>
    </Box>
  );
}
