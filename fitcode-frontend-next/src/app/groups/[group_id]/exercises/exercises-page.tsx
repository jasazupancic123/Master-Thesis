'use client';

import { Pagination as PaginationType } from '@/common/type/paginate.type';
import { ExerciseCard } from '@/components/exercise-card';
import ExerciseChips from '@/components/exercise-chips';
import ExerciseModal from '@/components/exercise-modal';
import GroupSidebar from '@/components/group-sidebar';
import PageTitle from '@/components/page-title';
import { SearchBar } from '@/components/search-bar';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Save } from '@mui/icons-material';
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
  handlePaginateExercises,
  handleUpdateExercise,
} from './state';
import MyModal from '@/components/modal';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { handleApiRequest } from '@/common/type/state.type';
import { ExerciseAttributeValue } from '@/controller/exercise/type/exercise-attribute-value.type';
import toast from 'react-hot-toast';
import { CommonService } from '@/common/service/common.service';

const commonService = CommonService.instance;

export const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentIds: [],
  valuesObject: {},
};

export function ExercisesPage() {
  const {
    token,
    groups,
    group,
    components,
    attributes,
    exercises: allExercises,
  } = useGroup();

  const router = useRouter();
  const theme = useTheme();
  const screenSize = useScreenSize();

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
    <>
      <Box>
        <GroupSidebar groups={groups} group={group} />
      </Box>

      <Box p={2} px={screenSize.isMobile ? 0 : undefined}>
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
            onConfirm={async () => {
              handleAddExercise(token, exercise, {
                router,
                components,
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
            data={exercise}
            setData={setExercise}
            attributes={attributes}
            components={components}
            isOpen={modal.edit}
            setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
            title={
              exercise.ownerId === 'global'
                ? 'Exercise Details'
                : 'Update Exercise'
            }
            {...(exercise.ownerId !== 'global' && {
              onConfirm: async () => {
                handleUpdateExercise(token, exercise!.id!, exercise, {
                  router,
                  components,
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
          onCancel={() =>
            setModal((prev) => ({ ...prev, confirmDelete: false }))
          }
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
      </Box>
    </>
  );
}
