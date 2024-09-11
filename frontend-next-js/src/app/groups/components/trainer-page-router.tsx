'use client';

import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, TextField, ToggleButtonGroup } from '@mui/material';
import Typography from '@mui/material/Typography';
import MyModal from '@/common/components/modal';
import { CreateGroup, Group } from '@/group/type/group.type';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import { ApiUtil } from '@/common/service/util/api.util';
import SelectData from '@/common/components/select-data';
import { User } from '@/user/type/user.type';
import CreateCycleModal from '@/group/components/create-cycle-modal';
import { CreateCycle, Cycle } from '@/group/type/cycle.type';
import { TrainingFilter } from '@/app/groups/components/training-filter';
import FilterButton from '@/app/groups/components/filter-button';
import TrainerDayView from '@/app/groups/components/trainer-day-view';
import TrainerCycleView from '@/app/groups/components/trainer-cycle-view';
import TrainerYearView from '@/app/groups/components/trainer-year-view';
import TrainerWeekView from '@/app/groups/components/trainer-week-view';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SelectInput from '@/app/groups/components/select-input';
import dayjs from 'dayjs';
import { FirebaseFirestoreUtil } from '@/common/service/util/firebase-firestore.util';
import { AppContextType } from '@/common/type/context.type';
import { GroupPageProps } from '@/group/type/props.type';

const TEST_SUBGROUP_DURATION_VALUE = 1000;

export default function TrainerPageRouter(props: GroupPageProps) {
  // context
  const { token } = useAppContext() as AppContextType;

  // modal
  const [modal, setModal] = useState({
    group: false,
    subgroup: false,
    cycle: false,
  });

  // group to create or update
  const [create, setCreate] = useState({
    group: { name: '', memberIds: [], parentId: null as string | null },
    subgroup: { name: '', memberIds: [], parentId: null as string | null, validUntil: 0 },
    // cycle modal is a separate components
  });

  const mapper: Record<TrainingFilter, ReactNode> = {
    day: <TrainerDayView {...props} />,
    week: <TrainerWeekView {...props} />,
    cycle: <TrainerCycleView {...props} />,
    year: <TrainerYearView {...props} />,
  };

  // actions to add group, subgroup or cycle
  const actions = [
    {
      icon: <GroupIcon />,
      title: 'Add group',
      onClick: () => setModal({ ...modal, group: true }),
      show: (_props: GroupPageProps['selected']): boolean => true,
    },
    {
      icon: <GroupsIcon />,
      title: 'Add subgroup',
      onClick: () => setModal({ ...modal, subgroup: true }),
      show: (props: GroupPageProps['selected']): boolean => !!props.group,
    },
    {
      icon: <RotateRightIcon />,
      title: 'Add cycle',
      onClick: () => setModal({ ...modal, cycle: true }),
      show: (props: GroupPageProps['selected']): boolean => !!props.group,
    },
  ];

  /**
   * Create group
   */
  async function createGroup(group: CreateGroup) {
    try {
      props.setLoading(true);
      const response = await ApiUtil.createGroup(group, token);
      setModal({ ...modal, group: false });

      props.setSelected({
        group: response,
        subgroup: null,
        cycle: null,
        cycles: [],
        trainings: [],
      });

      props.setGroups(prev => [...prev, response]);
      setCreate({ ...create, group: { name: '', memberIds: [], parentId: null } });
    } catch (e) {
      toast.error(e.message);
    } finally {
      props.setLoading(false);
    }
  }

  /**
   * Create subgroup
   */
  async function createSubgroup(subgroup: CreateGroup) {
    if (!props.selected.group)
      return;

    try {
      props.setLoading(true);

      const validUntilValue = subgroup.validUntil as number;
      const validUntil = validUntilValue === 0 ? dayjs(props.selected.cycle!.endDate) : dayjs().add(validUntilValue, 'd');
      const response = await ApiUtil.createGroup({
        name: subgroup.name,
        memberIds: subgroup.memberIds,
        parentId: props.selected.group.id,
        validUntil: validUntilValue === TEST_SUBGROUP_DURATION_VALUE
          ? dayjs().add(10, 's').toISOString() as Date
          : validUntil.toISOString() as Date,
      }, token);

      props.setSelected(prev => ({
        ...prev,
        group: {
          ...prev.group!,
          subgroups: [...(prev.group!.subgroups || []), response],
          // remove members that are in subgroup
          memberIds: (prev.group!.memberIds || []).filter(id => !subgroup.memberIds.includes(id)),
        },
        subgroup: response,
      }));

      props.setGroups(prev => {
        const group = prev.find(group => group.id === props.selected.group!.id);
        if (!group)
          return prev;

        // add subgroup to group
        group.subgroups = [...(group.subgroups || []), response];
        return [...prev];
      });

      setModal({ ...modal, subgroup: false });
      setCreate({
        ...create,
        subgroup: { name: '', memberIds: [], parentId: props.selected.group!.id, validUntil: 0 },
      });
      toast.success('Successfully created subgroup');
    } catch (e) {
      toast.error(e.message || 'Failed to create subgroup');
    } finally {
      props.setLoading(false);
    }
  }

  /**
   * Create cycle
   */
  async function createCycle(cycle: CreateCycle) {
    if (!props.selected.group)
      return;

    const body = {
      name: cycle.name,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
      groupId: props.selected.group.id,
    };

    try {
      props.setLoading(true);
      const response = await ApiUtil.createCycle(body as Partial<Cycle>, token);
      const populated = FirebaseFirestoreUtil.populateCycle(response);

      props.setSelected(prev => ({
        ...prev,
        cycles: [...prev.cycles, populated],
        cycle: populated,
      }));

      setModal({ ...modal, cycle: false });
      toast.success('Successfully created cycle');
    } catch (e) {
      toast.error(e.message || 'Failed to create cycle');
    } finally {
      props.setLoading(false);
    }
  }

  return (<>
      <Box
        bgcolor="background.paper"
        sx={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}
      >
        {/* Date filter */}
        <Box mx="auto" justifyContent="center">
          <ToggleButtonGroup
            value={props.filter}
            exclusive
            onChange={(event, value) => props.setFilter(value as TrainingFilter)}
            sx={{ display: 'flex', bgcolor: '#1A2B3C', width: 300, mx: 'auto' }}
          >
            <FilterButton value="day" />
            <FilterButton value="week" />
            <FilterButton value="cycle" />
            <FilterButton value="year" />
          </ToggleButtonGroup>

          {/* Dropdowns to select group, subgroup and cycle */}
          <Box
            p={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              {/* Select group */}
              <SelectInput<Group>
                label="Group"
                icon={<GroupIcon />}
                value={props.selected.group?.id || ''}
                setValue={(value) => {
                  const group = props.groups.find((group) => group.id === value);
                  props.setSelected(prev => ({ ...prev, group }));
                }}
                items={props.groups}
                itemKey="id"
                itemName="name"
              />

              {/* Select subgroup */}
              {props.selected.group &&
                <SelectInput<Group>
                  label="Subgroup"
                  icon={<GroupsIcon />}
                  value={props.selected.subgroup?.id || ''}
                  setValue={(value) => {
                    const subgroup = (props.selected.group!.subgroups || []).find(subgroup => subgroup.id === value);
                    props.setSelected(prev => ({ ...prev, subgroup }));
                  }}
                  items={props.selected.group.subgroups || []}
                  itemKey="id"
                  itemName="name"
                />
              }

              {/* Select cycle */}
              {props.selected.group &&
                <SelectInput<Cycle>
                  label="Cycle"
                  icon={<RotateRightIcon />}
                  value={props.selected.cycle?.id || ''}
                  setValue={(value) => {
                    const cycle = props.selected.cycles.find(cycle => cycle.id === value);
                    props.setSelected(prev => ({ ...prev, cycle }));
                  }}
                  items={props.selected.cycles}
                  itemKey="id"
                  itemName="name"
                />
              }
            </Box>

            {/* Buttons to add group, subgroup or cycle */}
            <SpeedDial
              icon={<SpeedDialIcon />}
              direction="left"
              ariaLabel="add-group-subgroup-cycle"
            >
              {actions.map((action, i) => {
                if (action.show(props.selected))
                  return <SpeedDialAction
                    key={i}
                    icon={action.icon}
                    tooltipTitle={action.title}
                    onClick={action.onClick}
                  />;

                return null;
              })}
            </SpeedDial>
          </Box>
        </Box>

        {/* Create group modal */}
        <MyModal
          isOpen={modal.group}
          setIsOpen={(open) => setModal({ ...modal, groupId: open })}
          onCancel={() => setModal({ ...modal, group: false })}
          onConfirm={() => createGroup(create.group)}
        >
          <Typography variant="h6" mb={2}>Create Group</Typography>

          <Box mt={2} />

          <TextField
            sx={{ mb: 2 }}
            label="Name"
            fullWidth
            value={create.group.name || ''}
            onChange={(event) =>
              setCreate({ ...create, group: { ...create.group, name: event.target.value } })
            }
          />

          <SelectData<User>
            multiple
            data={props.users}
            dataKeyProp="uid"
            dataValueProp="email"
            label="Members"
            value={create.group.memberIds || []}
            onChange={(memberIds) =>
              setCreate({ ...create, group: { ...create.group, memberIds } })
            }
          />
        </MyModal>

        {/* Create subgroup modal */}
        {props.selected.group && <>
          <MyModal
            isOpen={modal.subgroup}
            setIsOpen={(open) => setModal({ ...modal, subgroup: open })}
            onCancel={() => setModal({ ...modal, subgroup: false })}
            onConfirm={() => createSubgroup(create.subgroup as CreateGroup)}
          >
            <Typography variant="h6" mb={2}>Create Subgroup</Typography>

            <Box mt={2} />

            <TextField
              sx={{ mb: 2 }}
              label="Name"
              fullWidth
              value={create.subgroup?.name || ''}
              onChange={(event) =>
                setCreate({ ...create, subgroup: { ...create.subgroup, name: event.target.value } })
              }
            />

            <SelectData<User>
              // NOTE - selected group member ids can be null, if group has all users in its subgroups, but selected group
              // members are fetched from all subgroups, so we need to filter out members that are not in selected group
              multiple
              data={props.selected.group.memberIds.map(id => (props.selected.group!.members || []).find(user => user.uid === id) as User)}
              dataKeyProp="uid"
              dataValueProp="email"
              label="Members"
              value={create.subgroup.memberIds || []}
              onChange={(memberIds) =>
                setCreate({ ...create, subgroup: { ...create.subgroup, memberIds } })
              }
            />

            <Box mt={2} />

            {/* Subgroup duration */}
            <SelectData<{ label: string, value: number }>
              data={[
                { label: '10 seconds', value: TEST_SUBGROUP_DURATION_VALUE }, // TODO - only for testing, remove later
                { label: '1 day', value: 1 },
                { label: '1 week', value: 7 },
                { label: 'Cycle', value: 0 },
              ]}
              dataKeyProp="value"
              dataValueProp="label"
              label="Duration"
              value={create.subgroup.validUntil || 0}
              onChange={(value) => {
                setCreate({ ...create, subgroup: { ...create.subgroup, validUntil: value } });
              }}
            />
          </MyModal>

          {/* Create cycle modal */}
          <CreateCycleModal
            open={modal.cycle}
            setOpen={(open) => setModal({ ...modal, cycle: open })}
            onConfirm={(data) => createCycle(data)}
          />
        </>
        }
      </Box>

      {/* Render selected filter */}
      {mapper[props.filter]}
    </>
  );
}