'use client';

import React, { ReactNode, useState, useEffect } from 'react';
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
import SelectInput from '@/common/components/select-input';
import { AppContextType } from '@/common/type/context.type';
import { GroupPageProps } from '@/group/type/props.type';
import { GroupPageSidebarProps } from '@/group/type/sidebar.type';
import { GroupController } from '@/group/group.controller';
import { Group } from '@/group/entity/group.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { FilterType } from '@/group/type/filter.type';
import SettingsIcon from '@mui/icons-material/Settings';
import { GroupSettings } from '@/group/components/group-settings';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import GroupsSidebar from '@/common/components/groups-sidebar';
import { LOCAL_STORAGE_KEYS } from '@/common/constant/local-storage.constant';
import { Subgroups } from '@/group/components/subgroups';

export default function TrainerPageRouter(props: GroupPageProps) {
  // context
  const { token } = useAppContext() as AppContextType;

  // modal
  const [modal, setModal] = useState({
    add_group: false,
    members: false,
    subgroups: false,
    settings: false,
  });

  const sidebarProps = { ...props, setModal } as GroupPageSidebarProps;

  useEffect(() => {
    const storedGroupId = localStorage.getItem(
      LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID
    );

    if (storedGroupId && !props.selected.group) {
      const group = props.groups.data?.find((g) => g.id === storedGroupId);

      if (group) {
        props.setSelected((prev) => ({
          ...prev,
          group,
          cycle: null,
          subgroup: null,
        }));
      }
    }
  }, [props.groups.data, props.selected.group]);

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

      // populate available members
      if (!response.availableMembersIds)
        response.availableMembersIds = group.membersIds;

      props.groups.setData((prev) => [...(prev || []), response]);
      props.setSelected({
        group: response,
        subgroup: null,
        cycle: null,
      });
      setCreate({ ...create, group: { name: '', membersIds: [] } });
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID,
        response.id as string
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      props.setLoading(false);
    }
  }

  return (
    <>
      {/* <GroupsSidebar {...sidebarProps} /> */}
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
          <Box p={2} alignItems="center" justifyContent="space-between">
            <Box>
              {/* Select group */}
              {!props.selected.group && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  m={5}
                >
                  <Typography variant="h6">Select a group</Typography>
                </Box>
              )}

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
              {props.selected.group && (
                <SelectInput<Cycle>
                  label="Cycle"
                  icon={<RotateRightIcon />}
                  value={props.selected.cycle?.id || ''}
                  setValue={(value) => {
                    const cycles = props.selected.group!.cycles || [];
                    const cycle = cycles.find((cycle) => cycle.id === value);
                    props.setSelected((prev) => ({
                      ...prev,
                      cycle: cycle || null,
                    }));
                  }}
                  items={props.selected.group!.cycles || []}
                  itemKey="id"
                  itemName="name"
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Create group modal */}
        <MyModal
          isOpen={modal.add_group}
          setIsOpen={(open) => setModal({ ...modal, add_group: open })}
          onCancel={() => setModal({ ...modal, add_group: false })}
          onConfirm={() => createGroup(create.group)}
        >
          <Typography variant="h6" mb={2}>
            Create Group
          </Typography>

          <Box mt={2} />

          <TextField
            sx={{ mb: 2 }}
            label="Name"
            fullWidth
            value={create.group.name || ''}
            onChange={(event) =>
              setCreate({
                ...create,
                group: { ...create.group, name: event.target.value },
              })
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

        {props.selected.group && (
          <>
            {/* Subgroups modal */}
            <MyModal
              isOpen={modal.subgroups}
              setIsOpen={(open) => setModal({ ...modal, subgroups: open })}
              onCancel={() => setModal({ ...modal, subgroups: false })}
              cancelText="Close"
            >
              <Subgroups
                members={props.users.data || []}
                subgroups={props.selected.group.subgroups || []}
              />
            </MyModal>
          </>
        )}

        {props.selected.group && (
          <>
            {/* Group Settings modal */}
            <MyModal
              isOpen={modal.settings}
              setIsOpen={(open) => setModal({ ...modal, settings: open })}
              onCancel={() => setModal({ ...modal, settings: false })}
              cancelText="Close"
            >
              <GroupSettings {...props} />
            </MyModal>
          </>
        )}
      </Box>

      {/* Render selected filter */}
      {mapper[props.filter] || (
        <Box
          sx={{
            backgroundColor: '#1A2B3C',
            height: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderTopRightRadius: '0px',
            borderTopLeftRadius: '0px',
            borderBottomRightRadius: '20px',
            borderBottomLeftRadius: '20px',
          }}
        />
      )}
    </>
  );
}
