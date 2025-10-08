'use client';

import { Avatar, Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';

import { DEFAULT_SUBGROUP_ID } from '../trainer-day-view/constant';
import TrainingMembersSubgroup from './training-members-subgroups';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import useTrainingMembersSubgroups from './hooks/use-subgroups.hook';
import useTrainingMembers from './hooks/use-members.hook';
import { useGroup } from '@/store/group.provider';
import { handleOnDragEnd } from './actions/actions-dnd';
import { updateSelectedAthlete } from './actions/actions-subgroups';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const { isSticky } = props;
  const theme = useTheme();

  const { users } = useMain();
  const { setDetectedChanges } = useGroup();
  const {
    training,
    setTraining,
    component,
    setComponent,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
  } = useTrainerDayViewContext();

  const { members, sortedMembers, item } = useTrainingMembers();
  const { subgroups, setSubgroups, changedSubgroupIds, setChangedSubgroupIds } =
    useTrainingMembersSubgroups();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (selectedAthlete || !training || !component) return null;

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
        <DragDropContext
          onDragEnd={(result) =>
            handleOnDragEnd(
              { result },
              {
                users,
                training,
                setTraining,
                component,
                setComponent,
                subgroups,
                setSubgroups,
                changedSubgroupIds,
                setChangedSubgroupIds,
                selectedSubgroup,
                setSelectedSubgroup,
                members,
                setDetectedChanges,
                selectedAthlete,
                setSelectedAthlete,
              }
            )
          }
        >
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
                          updateSelectedAthlete(
                            {
                              member,
                              subgroupId: DEFAULT_SUBGROUP_ID,
                            },
                            {
                              component,
                              selectedSubgroup,
                              setSelectedSubgroup,
                              selectedAthlete,
                              setSelectedAthlete,
                            }
                          );
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
                      anchorEl={anchorEl}
                      setAnchorEl={setAnchorEl}
                    />
                  );
                })}
          </Box>
        </DragDropContext>
      </Stack>
    </Stack>
  );
}
