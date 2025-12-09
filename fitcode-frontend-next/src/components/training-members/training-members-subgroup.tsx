'use client';

import { useSortable } from '@dnd-kit/sortable';
import { MoreVert } from '@mui/icons-material';
import {
  Box,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';

import { DEFAULT_SUBGROUP_ID } from '../trainer-group-day-view/constant/subgroups.constant';
import { handleDeleteSubgroup } from './actions/actions-subgroups';
import type { UseTrainingMembersReturnType } from './hooks/use-members.hook';
import SubgroupMember from './subgroup-member';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { User } from '@/core/user/type/user.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useGroup } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface TrainingMembersSubgroupProps {
  subgroup: Subgroup;
  subgroupIndex: number;
  anchorEl: HTMLElement | null;
  setAnchorEl: SetState<HTMLElement | null>;
  trainingMembersContext: UseTrainingMembersReturnType;
  activeMember: User | null;
}

export default function TrainingMembersSubgroup(
  props: TrainingMembersSubgroupProps
) {
  const theme = useTheme();

  const mainContext = useMain();
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();

  const {
    component,
    training,
    setSelectedSubgroup,
    selectedSubgroup,
    setSelectedAthlete,
    selectedExerciseIds,
    setSelectedExerciseIds,
  } = trainerDayViewContext;

  const {
    subgroup,
    subgroupIndex,
    anchorEl,
    setAnchorEl,
    trainingMembersContext,
    activeMember,
  } = props;

  const { members } = trainingMembersContext;

  const { listeners, setNodeRef } = useSortable({
    id: subgroup.id,
  });

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isSubgroupSelected = (id: string): boolean => {
    if (selectedSubgroup?.id === id) return true;
    else if (!selectedSubgroup && id === DEFAULT_SUBGROUP_ID) return true;

    return false;
  };

  if (!training) return null;

  return (
    <>
      <div
        onClick={() => {
          if (
            selectedSubgroup?.id === subgroup.id ||
            (!selectedSubgroup &&
              subgroupIndex === 0 &&
              subgroup.id === DEFAULT_SUBGROUP_ID)
          )
            return;

          if (subgroupIndex > 0) {
            // subgroup
            setSelectedSubgroup(subgroup);
            setSelectedAthlete(undefined);

            setSelectedExerciseIds(
              subgroup.supersets
                .flatMap((s) => s.exercises)
                .filter((e) => selectedExerciseIds.some((se) => se === e.id))
                .map((e) => e.id) || []
            );
          } else if (subgroupIndex === 0) {
            // main group
            setSelectedSubgroup(null);
            setSelectedAthlete(undefined);

            if (!component) return;

            setSelectedExerciseIds(
              component?.supersets
                .flatMap((s) => s.exercises)
                .filter((e) => selectedExerciseIds.some((se) => se === e.id))
                .map((e) => e.id) || []
            );
          }
        }}
        style={{
          display: 'inline-block',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {subgroup.id !== DEFAULT_SUBGROUP_ID &&
          selectedSubgroup &&
          subgroup.id === selectedSubgroup.id && (
            <Box position="absolute" right={0} top={0}>
              <IconButton
                sx={{ p: 0, m: 0, zIndex: 1000 }}
                onClick={(event) => {
                  event.stopPropagation(); // Prevents clicking affecting parent elements
                  setAnchorEl(event.currentTarget);
                }}
              >
                <MoreVert sx={{ fontSize: 20 }} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    if (!component || !selectedSubgroup) return;
                    handleDeleteSubgroup(
                      {
                        subgroupId: selectedSubgroup.id,
                      },
                      {
                        useMain: mainContext,
                        useGroup: groupContext,
                        useTrainerDayViewContext: {
                          ...trainerDayViewContext,
                          training,
                          component,
                        },
                      }
                    );
                    handleMenuClose();
                  }}
                  sx={{ color: theme.palette.error.main }}
                >
                  Remove
                </MenuItem>
              </Menu>
            </Box>
          )}
        <Box
          display="flex"
          flexDirection={'column'}
          alignItems="center"
          sx={{
            marginRight:
              subgroup.id !== DEFAULT_SUBGROUP_ID &&
              selectedSubgroup &&
              selectedSubgroup.id === subgroup.id
                ? '20px'
                : undefined,
          }}
        >
          <Card
            key={`${subgroup.id}`}
            ref={setNodeRef}
            {...listeners}
            sx={{
              minWidth: 50,
              minHeight: 50,
              m: 0.1,
              ml: 0,
              backgroundColor: theme.palette.background.default,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {subgroup.membersIds.map((memberId, index) => {
              const member = members.find((user) => user.uid === memberId);
              if (!member) return null;

              return (
                <SubgroupMember
                  key={`${member.uid}-${index}`}
                  member={member}
                  subgroup={subgroup}
                  activeMember={activeMember}
                />
              );
            })}
          </Card>

          <Typography
            fontSize={12}
            fontWeight={600}
            sx={{
              textAlign: 'center',
              color: isSubgroupSelected(subgroup.id)
                ? theme.palette.primary.main
                : undefined,
            }}
          >
            {`G${subgroupIndex + 1}#${subgroup.membersIds.length}`}
          </Typography>
        </Box>
      </div>
    </>
  );
}
