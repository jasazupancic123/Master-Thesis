'use client';

import { Avatar, Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext } from 'react-beautiful-dnd';

import {
  DEFAULT_SUBGROUP,
  DEFAULT_SUBGROUP_ID,
} from '../trainer-day-view/constant';
import { onDragEndSubgroup } from '../trainer-day-view/state';
import TrainingMembersSubgroup from '../training-members-subgroups/training-members-subgroups';
import { handleAddMembersSubgroup, updateSelectedAthlete } from './state';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();

  const { users } = useMain();
  const { group, setDetectedChanges } = useGroup();

  const {
    component,
    setComponent,
    training,
    setTraining,
    setSelectedSubgroup,
    selectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext();

  const [changedSubgroupIds, setChangedSubgroupIds] = useState<string[]>([]);

  const item = training || group;
  const members = users.filter((user) => item.membersIds.includes(user.uid));

  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sortedMembers = [...members].sort((a, b) => {
    if (!training) return 0;

    const getSubgroupIndex = (uid: string) =>
      training.components
        .flatMap((c) => c.subgroups)
        .findIndex((s) => s.membersIds.includes(uid));

    const subgroupIndexA = getSubgroupIndex(a.uid);
    const subgroupIndexB = getSubgroupIndex(b.uid);

    // Place users without a subgroup first
    if (subgroupIndexA === -1 && subgroupIndexB !== -1) return -1;
    if (subgroupIndexA !== -1 && subgroupIndexB === -1) return 1;

    // If both have a subgroup, sort by subgroup index
    return subgroupIndexA - subgroupIndexB;
  });

  useEffect(() => {
    if (!training) return;

    if (!component) {
      setSubgroups([]);
      return;
    }

    let subgroups = component.subgroups || [];
    const availableMembers = members.filter(
      (member) =>
        !subgroups.some(
          (subgroup: Subgroup) =>
            subgroup.membersIds.includes(member.uid) && !subgroup.parentId
        )
    );

    const defaultSubgroup = subgroups.find(
      (sg) => sg.id === DEFAULT_SUBGROUP_ID
    );

    if (defaultSubgroup) {
      const defaultSubgroupMembers = members.filter((member) =>
        defaultSubgroup.membersIds.includes(member.uid)
      );
      availableMembers.push(...defaultSubgroupMembers);
    }

    // sort available members by group.membersIds
    availableMembers.sort((a, b) => {
      const indexA = item.membersIds.indexOf(a.uid);
      const indexB = item.membersIds.indexOf(b.uid);
      return indexA - indexB;
    });

    subgroups = subgroups.map((sg) => {
      const leafSubgroup = component.subgroups.find(
        (s) => s.parentId === sg.id
      );
      if (leafSubgroup) {
        const mergedMembers = [
          ...(sg.members || []),
          ...(leafSubgroup.members || []),
        ];
        const uniqueMembers = mergedMembers.filter(
          (m, index, self) => index === self.findIndex((t) => t.uid === m.uid)
        );

        return {
          ...sg,
          membersIds: [...sg.membersIds, ...leafSubgroup.membersIds].filter(
            (id, index, self) => self.indexOf(id) === index
          ),
          members: uniqueMembers,
        } as Subgroup;
      }

      if (sg.parentId === DEFAULT_SUBGROUP_ID) {
        const newMembers = (sg.members || []).filter(
          (m) =>
            !subgroups.some(
              (s) => s.id !== sg.id && s.membersIds.includes(m.uid)
            ) && !availableMembers.some((am) => am.uid === m.uid)
        );
        availableMembers.push(...newMembers);
      }

      return sg;
    });

    const newSubgroups = !subgroups.some((sg) => sg.id === DEFAULT_SUBGROUP_ID)
      ? [DEFAULT_SUBGROUP(availableMembers), ...subgroups]
      : subgroups.map((sg) => {
          if (sg.id === DEFAULT_SUBGROUP_ID) {
            return {
              ...sg,
              membersIds: availableMembers.map((m) => m.uid),
              members: availableMembers,
            };
          }
          return sg;
        });

    setSubgroups(newSubgroups);
  }, [training, component, selectedSubgroup]);

  const handleOnDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) {
      const user = members.find((m) => m.uid === draggableId);
      if (!user) return;
      await handleAddMembersSubgroup(
        { member: user },
        {
          training,
          setTraining,
          component,
          setComponent,
          setSelectedSubgroup,
          setSelectedAthlete,
          setDetectedChanges,
        }
      );
    } else {
      onDragEndSubgroup(result, {
        subgroups,
        setSubgroups,
        changedSubgroupIds,
        setChangedSubgroupIds,
        users,
        component,
        setComponent,
        training,
        setTraining,
      });
    }
  };

  if (selectedAthlete) return null;

  return (
    <Stack
      direction="row"
      px={2}
      justifyContent={isSticky ? 'center' : undefined}
    >
      {isSticky && (
        <div style={{ height: 116, width: '100%' }} /> // Mock Stack to maintain layout
      )}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-start"
        alignItems="center"
        sx={{
          width: !isSticky ? '100%' : undefined,
          maxWidth: 1500,
          borderRadius: '5px',
          rowGap: 1,
          display: 'flex',
          flexWrap: 'wrap',
          margin: 'auto',
          justifyContent: 'center',
          zIndex: isSticky ? 10 : undefined,
          position: isSticky ? 'fixed' : 'relative',
          top: isSticky ? '70px' : undefined,
          boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
          border: isSticky ? '1px solid grey' : undefined,
        }}
      >
        <DragDropContext onDragEnd={(result) => handleOnDragEnd(result)}>
          {/* No members to display*/}
          {!training && sortedMembers.length === 0 && (
            <Typography variant="caption" color="textSecondary">
              No available members
            </Typography>
          )}
          {/* Training/component is not selected yet, display the members normally */}
          {!component && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Card
                sx={{
                  m: 0.1,
                  ml: 0,
                  backgroundColor: 'transparent',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                {item.membersIds.map((memberId) => {
                  const member = members.find((user) => user.uid === memberId);

                  if (!member) return null;

                  return (
                    <Tooltip
                      key={`${member.uid}-tooltip`}
                      title={member.email}
                      sx={{ mx: 1, p: 0 }}
                    >
                      <Box
                        sx={{ p: 0, m: 0 }}
                        onClick={() => {
                          updateSelectedAthlete({
                            member,
                            selectedAthlete,
                            setSelectedAthlete,
                            component,
                            selectedSubgroup,
                            setSelectedSubgroup,
                            subgroupId: DEFAULT_SUBGROUP_ID,
                          });
                        }}
                        zIndex={1000}
                      >
                        <Avatar
                          className="avatar-border"
                          src={
                            users.find((m) => m.uid === member.uid)?.photoURL ||
                            '/user_avatar.png'
                          }
                          sx={{
                            width: 50,
                            height: 50,
                            m: selectedAthlete === member ? 0.25 : 0.5,
                            cursor: 'pointer',
                            filter: 'grayscale(100%)',
                          }}
                        />
                      </Box>
                    </Tooltip>
                  );
                })}
              </Card>

              <Typography
                fontSize={12}
                fontWeight={600}
                sx={{
                  textAlign: 'center',
                  color: theme.palette.primary.main,
                }}
              >
                {`G#${item.membersIds.length}`}
              </Typography>
            </Box>
          )}
          <Box display="flex" gap={4}>
            {training &&
              subgroups
                .filter((sg) => !sg.parentId) // display only top-level subgroups
                .map((subgroup, subgroupIndex) => {
                  // Assign border color based on the subgroup index
                  return (
                    <TrainingMembersSubgroup
                      key={subgroup.id}
                      subgroup={subgroup}
                      subgroupIndex={subgroupIndex}
                      subgroupsLength={
                        subgroups.filter((sg) => !sg.parentId).length
                      }
                      anchorEl={anchorEl}
                      setAnchorEl={setAnchorEl}
                      members={sortedMembers}
                    />
                  );
                })}
          </Box>
        </DragDropContext>
      </Stack>
    </Stack>
  );
}
