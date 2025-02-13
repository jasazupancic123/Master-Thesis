import { COLOR } from '@/common/constant/browser.constant';
import { CommonService } from '@/common/service/common.service';
import { ExerciseMeta } from '@/controller/training/type/training-plan.type';
import { Update } from '@mui/icons-material';
import BorderColor from '@/components/border-color';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  TextField,
  Tooltip,
  Grid2,
} from '@mui/material';
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers';
import { Fragment } from 'react';
import {
  addExercise,
  addSuperset,
  deleteExercise,
  updateExercise,
  deleteSuperset,
  updateSuperset,
} from './state';
import Subgroups from './subgroups';
import TrainingExerciseCard from './training-exercise-card';
import { FilteredExercises, TrainingCardProps } from './type';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const commonService = CommonService.instance;

export default function TrainingCard(props: TrainingCardProps) {
  const {
    token,
    setSelectedTrainings,
    users,
    setModal,
    setEditedSubgroup,
    filteredExercises,
    setFilteredExercises,
    components,
    training,
    exercises,
    period,
    day,
  } = props;

  return (
    <Box width="100%">
      <Box display="flex" mt={2}>
        <Box
          display="flex"
          width="10%"
          sx={{
            backgroundColor: '#005D57',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        >
          <Box
            p={2}
            sx={{
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 10,
            }}
          />
          <Typography variant="caption" p={1}>
            {period}
          </Typography>

          <Typography variant="caption" p={1}>
            {commonService.date.format(day.date)}
          </Typography>
        </Box>
      </Box>

      <Box
        key={training.id}
        sx={{
          border: '1px solidrgb(36, 38, 46)',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          backgroundColor: 'background.paper',
          p: 1,
          mt: 0,
        }}
      >
        <Subgroups
          training={training}
          setTrainings={setSelectedTrainings}
          setModal={setModal}
          users={users}
          setEditedSubgroup={setEditedSubgroup}
        />

        <Typography variant="h6" p={1}>
          Training ({commonService.date.formatTime(training.from)} -{' '}
          {commonService.date.formatTime(training.to)})
        </Typography>

        {Object.values(training.components || {})?.map((component, i) => {
          return (
            <Fragment key={i}>
              {/* Exercise list */}
              {filteredExercises.show &&
                filteredExercises.componentId === component.id && (
                  // exercises.superset && (
                  <Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      mt={2}
                      justifyContent="space-between"
                    >
                      <IconButton
                        sx={{ width: 40, height: 40, p: 1 }}
                        onClick={() => {
                          setFilteredExercises((prev: FilteredExercises) => ({
                            ...prev,
                            pagination: {
                              ...prev.pagination,
                              page:
                                prev.pagination.page - 1 >= 1
                                  ? prev.pagination.page - 1
                                  : 1,
                            },
                          }));
                        }}
                      >
                        <ArrowLeftIcon />
                      </IconButton>

                      <Grid2
                        container
                        width="100%"
                        spacing={1}
                        p={1}
                        columns={
                          filteredExercises.pagination.pageSize >
                          filteredExercises.pagination.total
                            ? filteredExercises.pagination.total
                            : filteredExercises.pagination.pageSize
                        }
                      >
                        {filteredExercises.data.map((exercise) => (
                          <Grid2
                            key={exercise.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() =>
                              addExercise(
                                token,
                                training.id,
                                filteredExercises.componentId!,
                                filteredExercises.superset!,
                                exercise.id,
                                setSelectedTrainings,
                                components,
                                exercises
                              )
                            }
                          >
                            <Box
                              sx={{
                                height: 60,
                                backgroundImage: `url(${
                                  exercise.imageUrl ||
                                  'https://mui.com/static/images/cards/contemplative-reptile.jpg'
                                })`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />

                            <Typography
                              gutterBottom
                              variant="caption"
                              component="div"
                              p={1}
                            >
                              {exercise.name}
                            </Typography>
                          </Grid2>
                        ))}
                      </Grid2>

                      <IconButton
                        sx={{ width: 40, height: 40, p: 1 }}
                        onClick={() => {
                          setFilteredExercises((prev) => ({
                            ...prev,
                            pagination: {
                              ...prev.pagination,
                              page:
                                prev.pagination.page + 1 <=
                                prev.pagination.pages
                                  ? prev.pagination.page + 1
                                  : prev.pagination.pages,
                            },
                          }));
                        }}
                      >
                        <ArrowRightIcon />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      {/* Cancel button */}
                      <Button
                        sx={{ p: 1 }}
                        color="secondary"
                        onClick={() =>
                          setFilteredExercises((prev) => ({
                            ...prev,
                            show: false,
                          }))
                        }
                      >
                        Cancel
                      </Button>

                      {/* Search exercises by name */}
                      <TextField
                        label="Search"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={filteredExercises.search.name}
                        onChange={(e) =>
                          setFilteredExercises((prev) => ({
                            ...prev,
                            search: { name: e.target.value },
                          }))
                        }
                      />
                    </Stack>
                  </Stack>
                )}

              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  my: 2,
                }}
              >
                <Box
                  height={40}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" alignItems="center" mt={1}>
                    <Typography
                      sx={{
                        color: '#1EB980',
                        px: 2,
                        mb: 0,
                        textTransform: 'uppercase',
                      }}
                    >
                      {components.find((c) => c.id === component.id)?.name}
                    </Typography>

                    {/* Add superset */}
                    <Tooltip title="Add superset">
                      <IconButton
                        onClick={async () => {
                          await addSuperset(
                            token,
                            training.id,
                            component.id,
                            {
                              color:
                                COLOR[
                                  (component.supersets?.length || 0) %
                                    COLOR.length
                                ],
                            },
                            setSelectedTrainings,
                            components,
                            exercises
                          );
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                <Box bgcolor="background.paper" p={2}>
                  {/* Supersets */}
                  <Grid2 container spacing={2} wrap="wrap">
                    {component?.supersets
                      ?.sort((a, b) => a.order - b.order)
                      ?.map((superset, i) => {
                        return (
                          <Grid2 size={{ xs: 6 }} key={i} spacing={3}>
                            <BorderColor color={superset.color || COLOR[i]} />

                            <Box>
                              {Object.values(superset?.exercises || {})?.map(
                                (exercise, k) => (
                                  <Box
                                    key={`${i}-${exercise.id}-${k}`}
                                    position="relative"
                                  >
                                    <Box position="absolute" top={0} right={0}>
                                      <Tooltip
                                        title="Delete exercise"
                                        placement="left"
                                      >
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            deleteExercise(
                                              token,
                                              training.id,
                                              component.id,
                                              i,
                                              exercise.id,
                                              {},
                                              setSelectedTrainings,
                                              components,
                                              exercises
                                            )
                                          }
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip
                                        title="Update exercise"
                                        placement="left"
                                      >
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            updateExercise(
                                              token,
                                              training.id,
                                              component.id,
                                              i,
                                              exercise.id,
                                              {
                                                color: `#${Math.floor(
                                                  Math.random() * 16777215
                                                )
                                                  .toString(16)
                                                  .padStart(6, '0')}`,
                                                order: 0,
                                              },
                                              setSelectedTrainings,
                                              components,
                                              exercises
                                            )
                                          }
                                        >
                                          <Update />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>

                                    <TrainingExerciseCard
                                      exercise={exercise}
                                      onChange={async (meta) => {
                                        await updateExercise(
                                          token,
                                          training.id,
                                          component.id,
                                          i,
                                          exercise.id,
                                          {
                                            meta: meta as ExerciseMeta,
                                          },
                                          setSelectedTrainings,
                                          components,
                                          exercises
                                        );
                                      }}
                                    />
                                  </Box>
                                )
                              )}
                            </Box>

                            <BorderColor
                              color={superset.color || COLOR[i]}
                              lower
                            />

                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              m={1}
                              spacing={1}
                            >
                              {/* Add exercises to superset */}
                              <Box
                                sx={{
                                  border: '1px dashed #B2B3B7',
                                  borderRadius: 2,
                                  flex: 1,
                                  display: 'flex',
                                  justifyContent: 'center',
                                }}
                              >
                                <Tooltip title="Add exercises">
                                  <IconButton
                                    onClick={() => {
                                      setFilteredExercises((prev) => ({
                                        ...prev,
                                        show: true,
                                        componentId: component.id,
                                        superset: i,
                                      }));
                                    }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>

                              <Tooltip title="Delete superset">
                                <IconButton
                                  sx={{
                                    border: 1,
                                    borderRadius: 2,
                                  }}
                                  size="small"
                                  onClick={() =>
                                    deleteSuperset(
                                      token,
                                      training.id,
                                      component.id,
                                      i,
                                      {},
                                      setSelectedTrainings
                                    )
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Randomly update superset">
                                <IconButton
                                  sx={{
                                    border: 1,
                                    borderRadius: 2,
                                  }}
                                  size="small"
                                  onClick={() =>
                                    updateSuperset(
                                      token,
                                      training.id,
                                      component.id,
                                      i,
                                      {
                                        color: `#${Math.floor(
                                          Math.random() * 16777215
                                        )
                                          .toString(16)
                                          .padStart(6, '0')}`,
                                        order: 0,
                                      },
                                      setSelectedTrainings,
                                      components,
                                      exercises
                                    )
                                  }
                                >
                                  <Update />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Grid2>
                        );
                      })}
                  </Grid2>
                </Box>
              </Box>
            </Fragment>
          );
        })}
      </Box>
    </Box>
  );
}
