'use client';

import { Pagination as PaginationType } from '@/common/type/paginate.type';
import { ExerciseCard } from '@/components/exercise-card/exercise-card';
import ExerciseChips from '@/components/exercise-chips/exercise-chips';
import ExerciseModal from '@/components/exercise-modal/exercise-modal';
import PageTitle from '@/components/page-title/page-title';
import { SearchBar } from '@/components/search-bar/search-bar';
import { useScreenSize } from '@/store/screen-size-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Pagination, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import MyModal from '@/components/modal/modal';
import {
  handleCreateManyExercises,
  handleCsvFileUpload,
  handleAddExercise,
  handleDeleteExercise,
  handlePaginateExercises,
  handleUpdateExercise,
} from '../app/dashboard/exercises/state';
import FileUpload from '@/components/file-upload/file-upload';
import { useExerciseContext } from '@/store/exercises-provider';
import { Publish } from '@mui/icons-material';
import { useAuth } from '@/store/auth-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentIds: [],
  valuesObject: {},
};

export default function ExercisesPage() {
  const {
    token,
    components,
    attributes,
    exercises: allExercises,
    profile,
  } = useExerciseContext();

  const router = useRouter();
  const theme = useTheme();
  const screenSize = useScreenSize();

  const roles = profile?.customClaims?.role || [];

  // filter exercises
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );

  const [exercises, setExercises] = useState([
    ...allExercises.filter((e) => !e.deletedAt),
  ]);

  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  // modals
  const [exercise, setExercise] = useState<Partial<Exercise>>(DEFAULT_EXERCISE);
  const [importedExercises, setImportedExercises] = useState<Exercise[]>([]);
  const [modal, setModal] = useState({
    add: false,
    edit: false,
    import: false,
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
    token,
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
      <Tooltip title="Import">
        <IconButton
          onClick={() => {
            setModal({ ...modal, import: true });
          }}
        >
          <Publish />
        </IconButton>
      </Tooltip>
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
        my={2}
        borderRadius={2}
        pb={1}
        bgcolor={theme.palette.background.paper}
      >
        <Box pb={1}>
          <PageTitle title="Exercises" />
        </Box>

        <ExerciseChips
          noSelectionLabel="All"
          components={ComponentService.toTree(components)}
          selected={selectedComponent}
          setSelected={(component) =>
            setSelectedComponent(component as Component)
          }
          bgColor={theme.palette.background.default}
          primaryColor={theme.palette.primary.main}
        />

        {/* Search Input */}
        <Box sx={{ py: 1 }}>
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

      <Box
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        gap={2}
        mb={10}
      >
        {filteredExercises.slice(0, 6).map((exercise, index) => (
          <Box
            key={exercise.id}
            width={{
              xs: '100%',
              sm: '100%',
              ml: '45%',
            }}
            sx={{
              cursor: 'pointer',
              flexBasis: screenSize.isMobile
                ? '100%'
                : screenSize.isSmallerThanLaptop
                  ? '45%'
                  : '30%',
              maxWidth: screenSize.isMobile
                ? '100%'
                : screenSize.isSmallerThanLaptop
                  ? '45%'
                  : '30%',
            }}
            onClick={() => {
              setModal({ ...modal, edit: true });
              setExercise(exercise);
            }}
          >
            <ExerciseCard exercise={exercise} />
          </Box>
        ))}
      </Box>

      {/* Add Exercise Modal*/}
      {modal.add && (
        <ExerciseModal
          data={{ ...exercise, imageUrl: undefined, videoUrl: undefined }}
          setData={setExercise}
          attributes={attributes}
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
          data={{
            ...exercise,
            /* valuesObject: commonService.object.flattenObject(
                ExerciseService.attributeValuesToNestedObject(
                  exercise.attributeValues || []
                )
              ), */
          }}
          setData={setExercise}
          attributes={attributes}
          components={components}
          isOpen={modal.edit}
          setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
          title={
            exercise.ownerId === 'global' && !roles.includes(UserRole.ADMIN)
              ? 'Exercise Details'
              : 'Update Exercise'
          }
          {...((exercise.ownerId !== 'global' ||
            roles.includes(UserRole.ADMIN)) && {
            onConfirm: async (attributes) => {
              handleUpdateExercise(token, exercise!.id!, exercise, {
                router,
                components,
                attributes,
                setFilteredExercises,
                setExercises,
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
            setExercises,
          });
          setModal((prev) => ({ ...prev, confirmDelete: false }));
        }}
      >
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center' }}>
          Delete exercise?
        </Typography>
      </MyModal>
      {/* Import exercises modal */}
      <MyModal
        isOpen={modal.import}
        setIsOpen={(open) => setModal((prev) => ({ ...prev, import: open }))}
        width={screenSize.isMobile ? undefined : 500}
        onConfirm={() => {
          handleCreateManyExercises(
            token,
            {
              exercises: importedExercises.map((exercise) => ({
                name: exercise.name,
                componentIds: exercise.componentIds,
                imageUrl: exercise.imageUrl,
                videoUrl: exercise.videoUrl,
                instruction: exercise.instruction,
                attributeValues: exercise.attributeValues,
              })),
            },
            { router, setExercises }
          );

          setModal((prev) => ({ ...prev, import: false }));
        }}
      >
        <FileUpload
          label="Import Exercises"
          input="csv"
          onFileUpload={async (file) => {
            handleCsvFileUpload(file, { setImportedExercises });
          }}
        />
      </MyModal>
    </Box>
  );
}
