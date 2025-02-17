'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Avatar, Stack, Tooltip, Typography } from '@mui/material';
import { useScreenSize } from '@/context/screen-size-provider';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const screenSize = useScreenSize();
  const { isSticky } = props;
  const { group, users, training, setSelectedSubgroup } = useGroup();
  const members = users.filter((user) => group.membersIds.includes(user.uid));

  // Sort members:
  // 1. Members without a subgroup come first
  // 2. Members in the same subgroup stay together
  const sortedMembers = [...members].sort((a, b) => {
    if (!training) return 0; // If no training data, return original order

    const getSubgroupIndex = (uid: string) =>
      Object.values(training.subgroups).findIndex((subgroup: any) =>
        subgroup.membersIds.includes(uid)
      );

    const subgroupIndexA = getSubgroupIndex(a.uid);
    const subgroupIndexB = getSubgroupIndex(b.uid);

    // Place users without a subgroup first
    if (subgroupIndexA === -1 && subgroupIndexB !== -1) return -1;
    if (subgroupIndexA !== -1 && subgroupIndexB === -1) return 1;

    // If both have a subgroup, sort by subgroup index
    return subgroupIndexA - subgroupIndexB;
  });

  return (
    <>
      <Stack
        direction="row"
        px={2}
        justifyContent={isSticky ? 'center' : undefined}
      >
        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-start"
          alignItems="center"
          sx={{
            width: !isSticky ? '100%' : undefined,
            maxWidth: 1500,
            borderRadius: 2,
            rowGap: 1,
            py: isSticky ? 1 : 2,
            display: 'flex',
            flexWrap: 'wrap',
            margin: 'auto',
            justifyContent: 'center',
            minHeight:
              group.membersIds && group.membersIds.length > 0 && !isSticky
                ? 80
                : undefined,
            backgroundColor: 'background.paper',
            zIndex: isSticky ? 1 : undefined,
            position: isSticky ? 'fixed' : undefined,
            top: isSticky ? '70px' : undefined,
            px: isSticky ? 2 : 0,
            boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
            border: isSticky ? '1px solid grey' : 'none',
          }}
        >
          {sortedMembers.length > 0 ? (
            sortedMembers.map((member) => {
              if (!member || !training)
                return (
                  <Tooltip key={member.uid} title={member.email} sx={{ p: 0 }}>
                    <div
                      style={{
                        display: 'inline-block',
                        border: '3px solid transparent',
                        borderRadius: '50%', // Ensure the border keeps its circular shape
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedSubgroup(null);
                      }}
                    >
                      <Avatar
                        className="avatar-border"
                        sx={{
                          width: 45,
                          height: 45,
                        }}
                      >
                        {member.email[0].toUpperCase()}
                      </Avatar>
                    </div>
                  </Tooltip>
                );

              // Find the subgroup index
              const subgroupIndex = Object.values(training.subgroups).findIndex(
                (subgroup: any) => subgroup.membersIds.includes(member.uid)
              );

              // Assign border color based on the subgroup index
              const borderColor =
                subgroupIndex !== -1
                  ? COLORS[(subgroupIndex % COLORS.length) + 1] // Fix the color selection
                  : 'transparent';

              return (
                <Tooltip key={member.uid} title={member.email} sx={{ p: 0 }}>
                  <div
                    onClick={(event) => {
                      const avatarElement =
                        event.currentTarget.querySelector('.avatar-border');
                      if (avatarElement && event.target !== avatarElement) {
                        const subgroup: Subgroup | undefined = Object.values(
                          training.subgroups
                        ).find((subgroup: any) =>
                          subgroup.membersIds.includes(member.uid)
                        );
                        setSelectedSubgroup({
                          subgroup: subgroup || null,
                          index: subgroupIndex,
                        });
                      } else {
                        const subgroup: Subgroup | undefined = Object.values(
                          training.subgroups
                        ).find((subgroup: any) =>
                          subgroup.membersIds.includes(member.uid)
                        );
                        if (subgroup === undefined) {
                          setSelectedSubgroup(null);
                        }
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      border: borderColor
                        ? `3px solid ${borderColor}`
                        : '3px solid transparent',
                      borderRadius: '50%', // Ensure the border keeps its circular shape
                      cursor: 'pointer',
                    }}
                  >
                    <Avatar
                      className="avatar-border"
                      sx={{
                        width: isSticky && screenSize.isMobile ? 30 : 45,
                        height: isSticky && screenSize.isMobile ? 30 : 45,
                      }}
                    >
                      {member.email[0].toUpperCase()}
                    </Avatar>
                  </div>
                </Tooltip>
              );
            })
          ) : (
            <Typography variant="caption" color="textSecondary">
              No available members
            </Typography>
          )}
        </Stack>
      </Stack>
    </>
  );
}
