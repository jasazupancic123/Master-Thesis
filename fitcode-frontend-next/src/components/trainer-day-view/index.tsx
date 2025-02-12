import React, { Fragment, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Circles from '@/components/circles';
import dayjs from 'dayjs';
import { TextField, Tooltip } from '@mui/material';
import { CommonService } from '@/common/service/common.service';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Grid from '@mui/material/Grid';
import Grid2 from '@mui/material/Grid2';
import { Day } from '@/common/service/util/date.util';
import DeleteIcon from '@mui/icons-material/Delete';
import { COLOR } from '@/common/constant/browser.constant';
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers';
import Button from '@mui/material/Button';
import { FitnessCenter, Update } from '@mui/icons-material';
import BorderColor from '@/components/border-color';
import TrainingExerciseCard from '@/components/trainer-day-view/training-exercise-card';
import Subgroups from './subgroups';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { FilterTypeViewProps } from '@/app/groups/[group_id]/type';
import TrainingMembers from './training-members';
import { FilteredExercises } from './type';
import {
  ExerciseMeta,
  TrainingComponent,
  TrainingPlan,
} from '@/controller/training/type/training-plan.type';
import {
  addExercise,
  addSuperset,
  deleteComponent,
  deleteExercise,
  updateExercise,
  deleteSuperset,
  updateSuperset,
  filterExercises,
} from './state';
import MyModal from '../modal';
import SelectInput from '../select-input';
import { Training } from '@/controller/training/type/training.type';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelectInputObject from '../select-input-object';
import { User } from '@/controller/user/type/user.type';
import { TrainingController } from '@/controller/training/training.controller';
import { COLORS } from '@/common/constant/color.constant';

const commonService = CommonService.instance;

export default function TrainerDayView(props: FilterTypeViewProps) {
  const {
    token,
    components,
    users,
    selectedCycle,
    selectedTraining,
    setSelectedTraining,
    trainings,
    setSelectedTrainings,
    exercises,
    setDate,
  } = props;

  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      sublabel: commonService.date.format(date, { withYear: false }),
    }))
  );

  const [editedSubgroup, setEditedSubgroup] = useState<Subgroup | null>(null);
  const [modal, setModal] = useState({ subgroup: false, editSubgroup: false });
  const [create, setCreate] = useState({
    subgroup: { name: '', membersIds: [] },
  });
  const [detectedSubgroupChanges, setDetectedSubgroupChanges] = useState(false);
  const todaysTrainings = trainings.filter((training) =>
    commonService.date.isSameDay(day.date, dayjs(training.from))
  );

  const [filteredExercises, setFilteredExercises] = useState<FilteredExercises>(
    {
      show: false,
      componentId: null,
      superset: 0,
      search: { name: '' },
      pagination: { page: 1, pageSize: 9, pages: 1, total: 0 },
      data: [],
    }
  );

  async function addSubgroup() {
    const training = props.selectedTraining;
    if (!training) return;

    const newTraining = await TrainingController.addSubgroup(
      token,
      training.id,
      {
        name: create.subgroup.name,
        membersIds: [],
      }
    );

    setSelectedTraining(newTraining);
    setModal((prev) => ({ ...prev, subgroup: false }));
    create.subgroup.name = '';
    create.subgroup.membersIds = [];
  }

  async function editSubgroup() {
    const training = props.selectedTraining;
    if (!training) return;

    if (!editedSubgroup) return;

    const newTraining = await TrainingController.updateSubgroup(
      token,
      training.id,
      editedSubgroup.id,
      {
        name: editedSubgroup.name,
        membersIds: editedSubgroup.membersIds,
      }
    );

    console.log('newTraining', newTraining);

    setSelectedTraining(newTraining);
    setModal((prev) => ({ ...prev, editSubgroup: false }));
    setEditedSubgroup(null);
  }

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (!filteredExercises.show || !filteredExercises.componentId) return;

    filterExercises(
      filteredExercises,
      exercises,
      components,
      setFilteredExercises
    );
  }, [
    token,
    filteredExercises.show,
    filteredExercises.componentId,
    filteredExercises.search.name,
    filteredExercises.pagination.page,
    filteredExercises.pagination.pageSize,
  ]);

  if (!selectedCycle) return <>Select cycle!</>;

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        sx={{
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          bgcolor: 'background.paper',
        }}
      >
        <Circles
          items={days}
          value={day.date.toString()}
          setValue={(value) => {
            setDay({ label: '', date: dayjs(value) });

            setDate({
              start: dayjs(value).startOf('day'),
              end: dayjs(value).endOf('day'),
              custom: true,
            });
          }}
          getBackgroundColor={(value, itemValue) =>
            commonService.date.isSameDay(dayjs(value), dayjs(itemValue))
              ? '#1EB980'
              : 'rgba(255, 255, 255, 0.1)'
          }
          sx={{
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            marginBottom: 3,
          }}
          arrows
          onArrowClick={(direction) => {
            const newDay =
              direction === 'left'
                ? day.date.subtract(1, 'day')
                : day.date.add(1, 'day');

            setDay({ label: '', date: newDay });
            props.setDate({
              start: newDay.startOf('day'),
              end: newDay.endOf('day'),
              custom: true,
            });

            setDays(
              commonService.date.getWeekDays(newDay).map(({ label, date }) => ({
                label: label[0],
                value: date.toString(),
                sublabel: commonService.date.format(date, { withYear: false }),
              }))
            );
          }}
        />

        <SelectInputObject
          label="Training"
          icon={<FitnessCenter />}
          value={selectedTraining?.id || ''}
          items={todaysTrainings}
          displayFormat="from-to" // or "id"
          setValue={(value) => {
            const training = trainings.find(
              (training) => training.id === value
            );
            setSelectedTraining(training || null);
          }}
        />

        {/* Training set groups with set exercises */}
        {trainings.length === 0 ? (
          <>No session for current date</>
        ) : !props.selectedTraining ? (
          <Typography variant="h6" p={1}>
            Select a training
          </Typography>
        ) : (
          <Box pb={15} width="100%">
            <Box
              key={props.selectedTraining.id}
              sx={{
                border: '1px solid #B2B3B7',
                borderRadius: 2,
                m: 1,
                p: 1,
              }}
            >
              <TrainingMembers
                training={props.selectedTraining}
                users={users}
              />
              <Subgroups
                token={token}
                training={props.selectedTraining}
                setSelectedTraining={setSelectedTraining}
                users={users}
                setTrainings={setSelectedTrainings}
                setModal={setModal}
                setEditedSubgroup={setEditedSubgroup}
                detectedSubgroupChanges={detectedSubgroupChanges}
                setDetectedSubgroupChanges={setDetectedSubgroupChanges}
              />

              <Typography variant="h6" p={1}>
                Training (
                {CommonService.instance.date.formatTime(
                  props.selectedTraining.from
                )}{' '}
                -{' '}
                {CommonService.instance.date.formatTime(
                  props.selectedTraining.to
                )}
                )
              </Typography>

              {Object.values(props.selectedTraining.components || {})?.map(
                (component, i) => {
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
                                  setFilteredExercises((prev) => ({
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
                                        props.selectedTraining!!.id,
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
                              {
                                components.find((c) => c.id === component.id)
                                  ?.name
                              }
                            </Typography>

                            {/* Add superset */}
                            <Tooltip title="Add superset">
                              <IconButton
                                onClick={async () => {
                                  await addSuperset(
                                    token,
                                    props.selectedTraining!!.id,
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

                          <IconButton
                            size="small"
                            onClick={() =>
                              deleteComponent(
                                token,
                                props.selectedTraining!!.id,
                                component.id,
                                setSelectedTrainings
                              )
                            }
                            sx={{ mr: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        <Box bgcolor="background.paper" p={2}>
                          {/* Supersets */}
                          <Grid container spacing={2} wrap="wrap">
                            {(component as TrainingComponent)?.supersets
                              ?.sort((a, b) => a.order - b.order)
                              ?.map((superset, i) => {
                                return (
                                  <Grid xs={6} key={i} spacing={3}>
                                    <BorderColor
                                      color={superset.color || COLOR[i]}
                                    />

                                    <Box>
                                      {Object.values(
                                        superset?.exercises || {}
                                      )?.map((exercise: any, k) => (
                                        <Box
                                          key={`${i}-${exercise.id}-${k}`}
                                          position="relative"
                                        >
                                          <Box
                                            position="absolute"
                                            top={0}
                                            right={0}
                                          >
                                            <Tooltip
                                              title="Delete exercise"
                                              placement="left"
                                            >
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  deleteExercise(
                                                    token,
                                                    props.selectedTraining!!.id,
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
                                                    props.selectedTraining!!.id,
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
                                                props.selectedTraining!!.id,
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
                                      ))}
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
                                              props.selectedTraining!!.id,
                                              component.id,
                                              superset.order,
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
                                              props.selectedTraining!!.id,
                                              component.id,
                                              superset.order,
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
                                  </Grid>
                                );
                              })}
                          </Grid>
                        </Box>
                      </Box>
                    </Fragment>
                  );
                }
              )}
            </Box>
          </Box>
        )}

        {/* Create subgroup modal */}
        <MyModal
          isOpen={modal.subgroup}
          setIsOpen={(subgroup) => setModal((prev) => ({ ...prev, subgroup }))}
          title="Create Subgroup"
          onCancel={() => setModal((prev) => ({ ...prev, subgroup: false }))}
          onConfirm={addSubgroup}
        >
          <Stack spacing={4} p={1}>
            {/* Name */}
            <TextField
              label="Name"
              fullWidth
              variant="outlined"
              size="small"
              value={create.subgroup.name}
              onChange={(e) =>
                setCreate((prev) => ({
                  ...prev,
                  subgroup: { ...prev.subgroup, name: e.target.value },
                }))
              }
            />
          </Stack>
        </MyModal>

        {/* Edit subgroup modal */}
        <MyModal
          isOpen={modal.editSubgroup}
          setIsOpen={(editSubgroup) =>
            setModal((prev) => ({ ...prev, editSubgroup }))
          }
          title="Edit Subgroup"
          onCancel={() => {
            setModal((prev) => ({ ...prev, editSubgroup: false }));
            setEditedSubgroup(null);
          }}
          onConfirm={editSubgroup}
        >
          <Stack spacing={4} p={1}>
            {/* Name */}
            <TextField
              label="Name"
              fullWidth
              value={editedSubgroup?.name || ''}
              variant="outlined"
              size="small"
              onChange={(e) =>
                setEditedSubgroup((prev) => {
                  if (!prev) return prev; // Return prev instead of undefined
                  return {
                    ...prev,
                    name: e.target.value,
                  };
                })
              }
            />
          </Stack>
        </MyModal>
      </Box>
    </>
  );
}
