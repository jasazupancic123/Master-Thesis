'use client';

import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { TextField, ToggleButtonGroup, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import MyModal from '@/common/components/modal';
import { CreateGroup } from '@/group/type/group.type';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import SelectData from '@/common/components/select-data';
import { User } from '@/user/type/user.type';
import FilterButton from '@/app/groups/components/filter-button';
import TrainerDayView from '@/app/groups/components/trainer-day-view';
import TrainerCycleView from '@/app/groups/components/trainer-cycle-view';
import TrainerYearView from '@/app/groups/components/trainer-year-view';
import TrainerWeekView from '@/app/groups/components/trainer-week-view';
import GroupIcon from '@mui/icons-material/Group';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import SelectInput from '@/app/groups/components/select-input';
import { AppContextType } from '@/common/type/context.type';
import { GroupPageProps } from '@/group/type/props.type';
import { GroupController } from '@/group/group.controller';
import { Group } from '@/group/entity/group.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { FilterType } from '@/group/type/filter.type';
import SettingsIcon from '@mui/icons-material/Settings';
import { GroupSettings } from '@/group/components/group-settings';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';

export default function TrainerPageRouter(props: GroupPageProps) {
  // context
  const { token } = useAppContext() as AppContextType;

  // modal
  const [modal, setModal] = useState({ group: false, editGroup: false, subgroup: false });

  // group to create or update
  const [create, setCreate] = useState({ group: { name: '', membersIds: [] } });

  const mapper: Record<FilterType, ReactNode> = {
    day: <TrainerDayView {...props} />,
    week: <TrainerWeekView {...props} />,
    cycle: <TrainerCycleView {...props} />,
    year: <TrainerYearView {...props} />,
  };

  async function createGroup(group: CreateGroup) {
    try {
      props.setLoading(true);
      const response = await GroupController.createGroup(token, group);
      setModal({ ...modal, group: false });

      // populate available members
      if (!response.availableMembersIds)
        response.availableMembersIds = group.membersIds;

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
              {/* Add new group */}
              <Tooltip title="Add group">
                <IconButton
                  onClick={() => setModal({ ...modal, group: true })}
                  sx={{ height: 50, width: 50 }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>

              {/* Select group */}
              <SelectInput<Group>
                label="Group"
                icon={<GroupIcon />}
                value={props.selected.group?.id || ''}
                setValue={(value) => {
                  const group = props.groups.data?.find((group) => group.id === value);
                  props.setSelected(prev => ({
                    ...prev,
                    group: group || null,
                    cycle: null,
                    subgroup: null,
                  }));
                }}
                items={props.groups.data || []}
                itemKey="id"
                itemName="name"
              />

              {/* Select subgroup */}
              {/*{props.selected.group &&
                <SelectInput<Subgroup>
                  label="Subgroup"
                  icon={<GroupsIcon />}
                  value={props.selected.subgroup?.id || ''}
                  setValue={(value) => {
                    const subgroup = props.selected.group!.subgroups?.find(subgroup => subgroup.id === value);
                    props.setSelected(prev => ({ ...prev, subgroup: subgroup || null }));
                  }}
                  items={props.selected.group.subgroups || []}
                  itemKey="id"
                  itemName="name"
                />
              }*/}

              {/* Select cycle */}
              {props.selected.group &&
                <SelectInput<Cycle>
                  label="Cycle"
                  icon={<RotateRightIcon />}
                  value={props.selected.cycle?.id || ''}
                  setValue={(value) => {
                    const cycles = props.selected.group!.cycles || [];
                    const cycle = cycles.find(cycle => cycle.id === value);
                    props.setSelected(prev => ({ ...prev, cycle: cycle || null }));
                  }}
                  items={props.selected.group!.cycles || []}
                  itemKey="id"
                  itemName="name"
                />
              }
            </Box>

            <Stack direction="row" spacing={1}>
              {/* Edit group settings */}
              {props.selected.group &&
                <Tooltip title="Edit group">
                  <IconButton
                    onClick={() => setModal({ ...modal, editGroup: true })}
                    sx={{ height: 50, width: 50 }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              }
            </Stack>
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

        {props.selected.group && <>
          {/* Edit group modal */}
          <MyModal
            isOpen={modal.editGroup}
            setIsOpen={(open) => setModal({ ...modal, editGroup: open })}
            onCancel={() => setModal({ ...modal, editGroup: false })}
            cancelText="Close"
          >
            <GroupSettings {...props} />
          </MyModal>
        </>
        }
      </Box>

      {/* Render selected filter */}
      {mapper[props.filter]}
    </>
  );
}