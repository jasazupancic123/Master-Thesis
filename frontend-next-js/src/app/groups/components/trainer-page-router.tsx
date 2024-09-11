'use client';

import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { SpeedDial, SpeedDialAction, SpeedDialIcon, TextField, ToggleButtonGroup } from '@mui/material';
import Typography from '@mui/material/Typography';
import MyModal from '@/common/components/modal';
import { CreateGroup } from '@/group/type/group.type';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import SelectData from '@/common/components/select-data';
import { User } from '@/user/type/user.type';
import CreateCycleModal from '@/group/components/create-cycle-modal';
import { CreateCycle } from '@/group/type/cycle.type';
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
import { AppContextType } from '@/common/type/context.type';
import { GroupPageProps } from '@/group/type/props.type';
import { GroupController } from '@/group/group.controller';
import { CreateSubgroup } from '@/group/type/subgroup.type';
import { Group } from '@/group/entity/group.entity';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { FilterType } from '@/group/type/filter.type';

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
    group: { name: '', membersIds: [] },
    subgroup: { name: '', membersIds: [], to: 0 }, // `to` is duration in days
    // cycle modal is a separate component
  });

  const mapper: Record<FilterType, ReactNode> = {
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

  async function createGroup(group: CreateGroup) {
    try {
      props.setLoading(true);
      const response = await GroupController.createGroup(token, group);
      setModal({ ...modal, group: false });

      props.setSelected({
        group: response,
        subgroup: null,
        cycle: null,
      });

      props.groups.setData(prev => [...(prev || []), response]);
      setCreate({ ...create, group: { name: '', membersIds: [] } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      props.setLoading(false);
    }
  }

  async function createSubgroup(subgroup: CreateSubgroup) {
    if (!props.selected.group || !props.selected.cycle)
      return;

    const group = props.selected.group;
    const cycle = props.selected.cycle;

    try {
      props.setLoading(true);

      const days = subgroup.to as unknown as number;
      const to = days === 0 ? dayjs(cycle.to) : dayjs().add(days, 'd');

      const response = await GroupController.addSubgroup(token, group.id, {
        cycleId: cycle.id,
        membersIds: subgroup.membersIds,
        name: subgroup.name,
        from: dayjs().toISOString() as unknown as Date,
        to: days === TEST_SUBGROUP_DURATION_VALUE
          ? dayjs().add(10, 's').toISOString() as unknown as Date
          : to.toISOString() as unknown as Date,
      });

      // fetch subgroup trainings
      const trainings = await GroupController.findTrainings(token, group.id, cycle.id, {
        subgroupId: response.id,
        from: props.date.start.toDate() || cycle.from,
        to: props.date.end.toDate() || cycle.to,
      });

      // remove members that are in subgroup from main group and update cycle trainings
      props.setSelected(prev => ({
        ...prev,
        group: {
          ...prev.group!,
          subgroups: [...(prev.group!.subgroups || []), response],
          memberIds: (prev.group!.membersIds || []).filter(id => !subgroup.membersIds.includes(id)),
        },
        subgroup: response,
        cycle: {
          ...prev.cycle!,
          trainings: trainings,
        },
      }));

      // add subgroup to group
      props.groups.setData(prev => {
        const groups = prev || [];
        const group = groups.find(group => group.id === props.selected.group!.id);
        if (!group)
          return prev;

        group.subgroups = [...(group.subgroups || []), response];
        return [...groups];
      });

      setModal({ ...modal, subgroup: false });
      setCreate({ ...create, subgroup: { name: '', membersIds: [], to: 0 } });
      toast.success('Successfully created subgroup');
    } catch (e: any) {
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

    const group = props.selected.group;

    try {
      props.setLoading(true);

      const response = await GroupController.addCycle(token, group.id, cycle);
      if (!response) {
        toast.error('Failed to create cycle');
        return;
      }

      // add cycle to group
      props.setSelected(prev => ({
        ...prev,
        group: {
          ...prev.group!,
          cycles: [...(prev.group!.cycles || []), response],
        },
        cycle: {
          ...response,
          trainings: [],
        },
      }));

      setModal({ ...modal, cycle: false });
      toast.success('Successfully created cycle');
    } catch (e: any) {
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
            onChange={(_, value) => props.setFilter(value as FilterType)}
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
                  const group = props.groups.data?.find((group) => group.id === value);
                  if (group) props.setSelected(prev => ({ ...prev, group }));
                }}
                items={props.groups.data || []}
                itemKey="id"
                itemName="name"
              />

              {/* Select subgroup */}
              {props.selected.group &&
                <SelectInput<Subgroup>
                  label="Subgroup"
                  icon={<GroupsIcon />}
                  value={props.selected.subgroup?.id || ''}
                  setValue={(value) => {
                    const subgroup = props.selected.group!.subgroups?.find(subgroup => subgroup.id === value);
                    if (subgroup) props.setSelected(prev => ({ ...prev, subgroup }));
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
                    const cycles = props.selected.group!.cycles || [];
                    const cycle = cycles.find(cycle => cycle.id === value);
                    if (cycle) props.setSelected(prev => ({ ...prev, cycle }));
                  }}
                  items={props.selected.group!.cycles || []}
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
          setIsOpen={(open) => setModal({ ...modal, group: open })}
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
            data={props.users.data || []}
            dataKeyProp="uid"
            dataValueProp="email"
            label="Members"
            value={create.group.membersIds || []}
            onChange={(membersIds) =>
              setCreate({ ...create, group: { ...create.group, membersIds } })
            }
          />
        </MyModal>

        {/* Create subgroup modal */}
        {props.selected.group && <>
          <MyModal
            isOpen={modal.subgroup}
            setIsOpen={(open) => setModal({ ...modal, subgroup: open })}
            onCancel={() => setModal({ ...modal, subgroup: false })}
            onConfirm={() => createSubgroup(create.subgroup as unknown as CreateSubgroup)}
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
              data={props.selected.group.membersIds.map(id => (props.selected.group!.members || []).find(user => user.uid === id) as User)}
              dataKeyProp="uid"
              dataValueProp="email"
              label="Members"
              value={create.subgroup.membersIds || []}
              onChange={(membersIds) =>
                setCreate({ ...create, subgroup: { ...create.subgroup, membersIds } })
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
              value={create.subgroup.to || 0}
              onChange={(value) => {
                setCreate({ ...create, subgroup: { ...create.subgroup, to: value } });
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