import React, { Fragment, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Circles from '@/app/groups/components/circles';
import dayjs from 'dayjs';
import { TextField, Tooltip } from '@mui/material';
import { CommonService } from '@/common/service/common.service';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Grid from '@mui/material/Unstable_Grid2';
import Grid2 from '@mui/material/Unstable_Grid2';
import { useAppContext } from '@/context/app-provider';
import { Day } from '@/common/service/util/date.util';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { COLOR } from '@/common/constant/browser.constant';
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers';
import Button from '@mui/material/Button';
import MyModal from '@/components/modal';
import SelectInput from '@/components/select-input';
import { Groups, Update } from '@mui/icons-material';
import Warning from '@/components/warning';
import { useFetch } from '@/hook/use-fetch';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Training } from '@/controller/training/type/training.type';

const commonService = CommonService.instance;

export default function TrainerDayView(props: any) {
  const { token, components } = useAppContext();
  const allExercises = useFetch<Exercise[]>('/exercise');

  const { group, cycle } = props.selected;
  const [trainings, setTrainings] = useState<Training[]>([]);

  const [day, setDay] = useState<Day>(commonService.date.getToday());
  const [days, setDays] = useState(
    commonService.date.getWeekDays().map(({ label, date }) => ({
      label: label[0],
      value: date.toString(),
      sublabel: commonService.date.format(date, { withYear: false }),
    }))
  );

  const [modal, setModal] = useState({ subgroup: false });
  const [create, setCreate] = useState({
    subgroup: {
      name: '',
      membersIds: [],
    },
  });

  const [exercises, setExercises] = useState({
    show: false,
    componentId: null as string | null,
    superset: 0,
    search: { name: '' },
    pagination: { page: 1, pageSize: 9, pages: 1, total: 0 },
    data: [] as Exercise[],
  });

  async function addSubgroup() {
    const group = props.selected.group;
    if (!group) return;

    try {
      const subgroup = await GroupController.addSubgroup(token, group.id, {
        name: create.subgroup.name,
        membersIds: create.subgroup.membersIds,
        from: props.date.start.toDate(),
        to: props.date.end.toDate(),
      });

      // set selected subgroup
      props.setSelected((prev) => ({ ...prev, subgroup }));

      // add subgroup to selected group
      props.setSelected((prev) => ({
        ...prev,
        group: {
          ...prev.group!,
          availableMembersIds: (prev.group!.availableMembersIds || []).filter(
            (id) => !subgroup.membersIds.includes(id)
          ),
          subgroups: [...prev.group!.subgroups, subgroup],
        },
      }));

      setModal((prev) => ({ ...prev, subgroup: false }));
      setCreate({ ...create, subgroup: { name: '', membersIds: [] } });
    } catch (e: any) {
      toast.error(e.message || 'Failed to add subgroup');
    }
  }

  async function deleteComponent(trainingId: string, componentId: string) {
    try {
      await TrainingController.deleteTrainingComponent(
        token,
        trainingId,
        componentId
      );

      // update training components
      setTrainings((prev) =>
        prev.map((training) => {
          if (training.id === trainingId) {
            training.components = training.components?.filter(
              (c) => c.id !== componentId
            );
          }

          return training;
        })
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete training component');
    }
  }

  async function addSuperset(
    trainingId: string,
    componentId: string,
    input: CreateTrainingSuperset
  ) {
    try {
      let response = await TrainingController.addSuperset(
        token,
        trainingId,
        componentId,
        { ...input, exercises: {} as [] }
      );

      response = TrainingService.map(response, {
        components: components.flat,
        exercises: allExercises.data!,
      });

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId
            ? {
                ...training,
                components: training.components?.map((component) =>
                  component.id === componentId
                    ? response.components.find((c) => c.id === componentId)!
                    : component
                ),
              }
            : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to add superset');
    }
  }

  async function updateSuperset(
    trainingId: string,
    componentId: string,
    superset: number,
    input: UpdateTrainingSuperset
  ) {
    try {
      let response = await TrainingController.updateSuperset(
        token,
        trainingId,
        componentId,
        superset,
        input
      );

      response = TrainingService.map(response, {
        components: components.flat,
        exercises: allExercises.data!,
      });

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId
            ? {
                ...training,
                components: training.components?.map((component) =>
                  component.id === componentId
                    ? response.components.find((c) => c.id === componentId)!
                    : component
                ),
              }
            : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to add superset');
    }
  }

  async function deleteSuperset(
    trainingId: string,
    componentId: string,
    superset: number
  ) {
    try {
      await TrainingController.deleteSuperset(
        token,
        trainingId,
        componentId,
        superset
      );

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId
            ? {
                ...training,
                components: training.components?.map((component) =>
                  component.id === componentId
                    ? {
                        ...component,
                        supersets: component.supersets?.filter(
                          (_, i) => i !== superset
                        ),
                      }
                    : component
                ),
              }
            : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete superset');
    }
  }

  async function addExercise(
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string
  ) {
    try {
      let response = await TrainingController.addTrainingExercises(
        token,
        trainingId,
        componentId,
        superset,
        [
          {
            id: exerciseId,
            meta: {
              sets: 3,
              setType: SetType.REPS,
              setTypeValue: 10,
              workloadType: WorkloadType.KG,
              workloadValue: 20,
              rec: 60,
              tempo: '0:0:0',
              effort: Effort.MODERATE,
            },
          },
        ]
      );

      response = TrainingService.map(response, {
        components: components.flat,
        exercises: allExercises.data!,
      });

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId
            ? {
                ...training,
                components: training.components?.map((component) =>
                  component.id === componentId
                    ? response.components.find((c) => c.id === componentId)!
                    : component
                ),
              }
            : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to add exercise');
    }
  }

  async function updateExercise(
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string,
    input: UpdateTrainingExercise
  ) {
    try {
      let response = await TrainingController.updateExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId,
        input
      );

      response = TrainingService.map(response, {
        components: components.flat,
        exercises: allExercises.data!,
      });

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId ? response : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to update exercise');
    }
  }

  async function deleteExercise(
    trainingId: string,
    componentId: string,
    superset: number,
    exerciseId: string
  ) {
    try {
      await TrainingController.deleteExercise(
        token,
        trainingId,
        componentId,
        superset,
        exerciseId
      );

      setTrainings((prev) =>
        prev.map((training) =>
          training.id === trainingId
            ? {
                ...training,
                components: training.components?.map((component) =>
                  component.id === componentId
                    ? {
                        ...component,
                        supersets: component?.supersets?.map((s, i) =>
                          i === superset
                            ? {
                                ...s,
                                exercises: s?.exercises?.filter(
                                  (e) => e.id !== exerciseId
                                ),
                              }
                            : s
                        ),
                      }
                    : component
                ),
              }
            : training
        )
      );
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete exercise');
    }
  }

  async function handleSave() {
    console.log('handle save:', trainings);

    try {
    } catch (e: any) {
      console.log(e?.message);
    }
  }

  /**
   * Fetch trainings' details
   */
  useEffect(() => {
    if (!allExercises.data) return;

    async function fetchTrainings() {
      const trainingIds =
        props.selected.cycle?.trainings?.map((t) => t.id) || [];

      if (!trainingIds.length) {
        setTrainings([]);
        return;
      }

      try {
        let response = await TrainingController.findTrainingsByIds(
          token,
          trainingIds
        );

        response = response.map((training) =>
          TrainingService.map(training, {
            components: components.flat,
            exercises: allExercises.data!,
          })
        );

        setTrainings(
          response.map((training) => ({
            ...training,
            exercises: training.components.map((component) => ({
              componentId: component.id,
              global: false,
              search: '',
              pagination: { page: 1, pageSize: 6, pages: 1, total: 0 },
              data: [],
            })),
          }))
        );
      } catch (e: any) {
        toast.error(e.message || 'Failed to fetch trainings');
      }
    }

    fetchTrainings().then();
  }, [
    props.selected.cycle?.id,
    props.selected.cycle?.trainings,
    props.date.start,
    props.date.end,
    props.date.custom,
    token,
  ]);

  /**
   * Filter exercises
   */
  useEffect(() => {
    async function fetchExercises() {
      if (!exercises.componentId || !exercises.show) return;
      if (allExercises.loading || allExercises.error || !allExercises.data)
        return;

      const filter = {
        componentsIds: [exercises.componentId],
        name: exercises.search.name,
      };

      let filtered = ExerciseService.filter(
        allExercises.data!,
        filter,
        components
      );

      const total = filtered.length;

      // paginate
      const pages = Math.ceil(total / exercises.pagination.pageSize);
      const page =
        pages < exercises.pagination.pages ? 1 : exercises.pagination.page;
      filtered = commonService.generic.paginate(filtered, {
        page,
        pageSize: exercises.pagination.pageSize,
        orderBy: { field: 'name', value: 'asc' },
      });

      // populate exercises
      filtered = filtered.map((exercise) =>
        ExerciseService.populate(exercise, components.flat)
      );

      setExercises((prev) => ({
        ...prev,
        data: filtered,
        pagination: {
          ...prev.pagination,
          total,
          pages: Math.ceil(total / prev.pagination.pageSize),
        },
      }));
    }

    fetchExercises().then();
  }, [
    exercises.show,
    exercises.componentId,
    exercises.search.name,
    exercises.pagination.page,
    exercises.pagination.pageSize,
    token,
  ]);

  /**
   * Reset exercises
   */
  useEffect(() => {
    setExercises((prev) => ({
      ...prev,
      componentId: null,
      superset: 0,
      data: [],
      show: false,
      global: true,
      search: { name: '' },
      pagination: {
        ...prev.pagination,
        page: 1,
      },
    }));
  }, [props.date.start, props.date.end, props.date.custom]);

  /**
   * Fetch available members for group
   */
  useEffect(() => {
    async function fetchAvailableMembers() {
      if (!group || !props.date.custom) return;

      try {
        props.setLoading(true);
        const response = await GroupController.findAvailableMembers(
          token,
          group.id,
          {
            from: props.date.start,
          }
        );

        props.setSelected((prev) => ({
          ...prev,
          group: {
            ...prev.group!,
            availableMembersIds: response,
          },
        }));
      } catch (e: any) {
        console.error(e);
      } finally {
        props.setLoading(false);
      }
    }

    fetchAvailableMembers().then();
  }, [token, group?.id, props.date.start, props.date.end, props.date.custom]);

  if (!group || !cycle) return <Warning title="Select cycle" topBorder />;

  return (
    <Box>
      <Circles
        items={days}
        value={day.date.toString()}
        setValue={(value) => {
          setDay({ label: '', date: dayjs(value) });

          props.setDate({
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

      {/* Group Member Avatars */}
      <Stack
        direction="row"
        p={3}
        pb={2}
        px={2}
        sx={{
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
          bgcolor: 'background.paper',
        }}
      >
        {!props.loading && (
          <Stack direction="row" spacing={1}>
            {group.availableMembersIds
              ?.map((id) => group.members?.find((m) => m.uid === id))
              .map(
                (member) =>
                  member && (
                    <Box
                      key={member.uid}
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        props.setSelected((prev) => ({
                          ...prev,
                          subgroup: null,
                        }))
                      }
                    >
                      <Tooltip title={member.email}>
                        <Avatar sx={{ width: 60, height: 60 }}>
                          {member.email[0].toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    </Box>
                  )
              )}

            {group.subgroups.map((subgroup, i) => {
              const members = subgroup.membersIds?.map((id) =>
                group.members?.find((m) => m.uid === id)
              );

              return (
                <Stack
                  key={subgroup.id}
                  direction="row"
                  spacing={1}
                  my={4}
                  onClick={() =>
                    props.setSelected((prev) => ({ ...prev, subgroup }))
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  {members.map(
                    (member) =>
                      member && (
                        <Box key={member.uid}>
                          <Tooltip title={member.email}>
                            <Avatar
                              sx={{
                                width: 60,
                                height: 60,
                                border: `2px solid ${COLOR[i % COLOR.length]}`,
                              }}
                            >
                              {member.email[0].toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        </Box>
                      )
                  )}
                </Stack>
              );
            })}

            {/* Add subgroup button */}
            {group.availableMembersIds!.length > 0 && (
              <IconButton
                size="small"
                sx={{ width: 40, height: 40 }}
                onClick={() =>
                  setModal((prev) => ({ ...prev, subgroup: true }))
                }
              >
                <AddIcon />
              </IconButton>
            )}
          </Stack>
        )}
      </Stack>

      {/* Select subgroup */}
      {props.selected.subgroup && (
        <Box mt={2}>
          <SelectInput<Subgroup>
            label="Subgroup"
            icon={<Groups />}
            value={props.selected.subgroup.id}
            setValue={(value) => {
              const subgroup = group.subgroups?.find(
                (subgroup) => subgroup.id === value
              );
              props.setSelected((prev) => ({
                ...prev,
                subgroup: subgroup || null,
              }));
            }}
            items={group.subgroups || []}
            itemKey="id"
            itemName="name"
          />
        </Box>
      )}

      {/* Training set groups with set exercises */}
      {trainings.length === 0 ? (
        <Warning title="No session for current date" />
      ) : (
        <Box mt={4} pb={15}>
          {trainings.map((training, i) => (
            <Box
              key={training.id}
              sx={{
                border: '1px solid #B2B3B7',
                borderRadius: 2,
                m: 1,
                p: 1,
              }}
            >
              <Typography variant="h6" p={1}>
                Training {i + 1} (
                {CommonService.instance.date.formatTime(training.from)} -{' '}
                {CommonService.instance.date.formatTime(training.to)})
              </Typography>

              {training?.components?.map((component, i) => {
                return (
                  <Fragment key={i}>
                    {/* Exercise list */}
                    {exercises.show &&
                      exercises.componentId === component.id && (
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
                                setExercises((prev) => ({
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
                                exercises.pagination.pageSize >
                                exercises.pagination.total
                                  ? exercises.pagination.total
                                  : exercises.pagination.pageSize
                              }
                            >
                              {exercises.data.map((exercise) => (
                                <Grid2
                                  xs={1}
                                  key={exercise.id}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() =>
                                    addExercise(
                                      training.id,
                                      exercises.componentId!,
                                      exercises.superset!,
                                      exercise.id
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
                                setExercises((prev) => ({
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
                                setExercises((prev) => ({
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
                              value={exercises.search.name}
                              onChange={(e) =>
                                setExercises((prev) => ({
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
                              components.flat.find(
                                ({ id }) => id === component.id
                              )?.name
                            }
                          </Typography>

                          {/* Add superset */}
                          <Tooltip title="Add superset">
                            <IconButton
                              onClick={async () => {
                                await addSuperset(training.id, component.id, {
                                  exercises: [],
                                  color:
                                    COLOR[
                                      (component.supersets?.length || 0) %
                                        COLOR.length
                                    ],
                                });
                              }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <IconButton
                          size="small"
                          onClick={() =>
                            deleteComponent(training.id, component.id)
                          }
                          sx={{ mr: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Box bgcolor="background.paper" p={2}>
                        {/* Supersets */}
                        <Grid container spacing={2} wrap="wrap">
                          {component?.supersets
                            ?.sort((a, b) => a.order - b.order)
                            ?.map((superset, i) => {
                              return (
                                <Grid xs={6} key={i} spacing={3}>
                                  <BorderColor
                                    color={superset.color || COLOR[i]}
                                  />

                                  <Box>
                                    {superset?.exercises?.map((exercise, k) => (
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
                                                  training.id,
                                                  component.id,
                                                  i,
                                                  exercise.id
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
                                                  }
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
                                              training.id,
                                              component.id,
                                              i,
                                              exercise.id,
                                              { meta }
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
                                            setExercises((prev) => ({
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
                                            training.id,
                                            component.id,
                                            superset.order
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
                                            training.id,
                                            component.id,
                                            superset.order,
                                            {
                                              color: `#${Math.floor(
                                                Math.random() * 16777215
                                              )
                                                .toString(16)
                                                .padStart(6, '0')}`,
                                              order: 0,
                                            }
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
              })}
            </Box>
          ))}
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

          {/* From & To */}
          {/*<Stack direction="row" spacing={3}>
          <TextField
            label="From"
            type="datetime-local"
            variant="outlined"
            size="small"
            value={create.subgroup.from.format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => setCreate(prev => ({
              ...prev,
              subgroup: { ...prev.subgroup, from: dayjs(e.target.value) },
            }))}
          />

          <TextField
            label="To"
            type="datetime-local"
            variant="outlined"
            size="small"
            value={create.subgroup.to.format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => setCreate(prev => ({
              ...prev,
              subgroup: { ...prev.subgroup, to: dayjs(e.target.value) },
            }))}
          />
        </Stack>*/}

          {/* Members from group's available members */}
          <Stack direction="row" spacing={1}>
            {group.availableMembersIds
              ?.map((id) => group.members?.find((m) => m.uid === id))
              .map(
                (member) =>
                  member && (
                    <Stack key={member.uid} direction="row" spacing={1}>
                      <Box position="relative">
                        <Avatar>{member.email[0].toUpperCase()}</Avatar>

                        <IconButton
                          sx={{ position: 'absolute', top: -10, right: -10 }}
                          size="small"
                          onClick={() =>
                            setCreate((prev) => ({
                              ...prev,
                              subgroup: {
                                ...prev.subgroup,
                                membersIds: prev.subgroup.membersIds.includes(
                                  member.uid
                                )
                                  ? prev.subgroup.membersIds.filter(
                                      (id) => id !== member.uid
                                    )
                                  : [...prev.subgroup.membersIds, member.uid],
                              },
                            }))
                          }
                        >
                          {create.subgroup.membersIds.includes(member.uid) ? (
                            <DeleteIcon />
                          ) : (
                            <AddIcon />
                          )}
                        </IconButton>
                      </Box>
                    </Stack>
                  )
              )}
          </Stack>
        </Stack>
      </MyModal>
    </Box>
  );
}
