import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Circles from '@/components/circles';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';
import { CommonService } from '@/common/service/common.service';
import { Day } from '@/common/service/util/date.util';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { FilterTypeViewProps } from '@/app/groups/[group_id]/type';
import TrainingMembers from './training-members';
import { FilteredExercises } from './type';
import { filterExercises } from './state';
import MyModal from '../modal';
import { Training } from '@/controller/training/type/training.type';
import { TrainingController } from '@/controller/training/training.controller';
import TrainingComponentPage from './training';

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

  const todaysTrainings = trainings.filter((training) =>
    commonService.date.isSameDay(day.date, dayjs(training.from))
  );

  const amTraining = todaysTrainings.find(
    (training) => dayjs(training.from).hour() < 12
  );

  const pmTraining = todaysTrainings.find(
    (training) => dayjs(training.from).hour() >= 12
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
            setDate({
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

        <TrainingMembers
          training={props.selectedTraining}
          group={props.group}
          users={users}
        />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        mt={2}
        pb={15}
        sx={{
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '20px',
        }}
      >
        {/* Training set groups with set exercises */}
        {todaysTrainings.length === 0 ? (
          <>No session for current date</>
        ) : (
          <>
            {amTraining && (
              <TrainingComponentPage
                token={token}
                setSelectedTrainings={setSelectedTrainings}
                selectedTraining={selectedTraining}
                users={users}
                setModal={setModal}
                setEditedSubgroup={setEditedSubgroup}
                filteredExercises={filteredExercises}
                setFilteredExercises={setFilteredExercises}
                components={components}
                training={amTraining}
                period="AM"
                exercises={exercises}
                day={day}
              />
            )}

            {pmTraining && (
              <TrainingComponentPage
                token={token}
                setSelectedTrainings={setSelectedTrainings}
                selectedTraining={selectedTraining}
                users={users}
                setModal={setModal}
                setEditedSubgroup={setEditedSubgroup}
                filteredExercises={filteredExercises}
                setFilteredExercises={setFilteredExercises}
                components={components}
                training={pmTraining}
                period="PM"
                exercises={exercises}
                day={day}
              />
            )}

            {/* Create subgroup modal */}
            <MyModal
              isOpen={modal.subgroup}
              setIsOpen={(subgroup) =>
                setModal((prev) => ({ ...prev, subgroup }))
              }
              title="Create Subgroup"
              onCancel={() =>
                setModal((prev) => ({ ...prev, subgroup: false }))
              }
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
          </>
        )}
      </Box>
    </>
  );
}
