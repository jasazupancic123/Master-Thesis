'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { Avatar, Stack, Tooltip, Typography } from '@mui/material';

export default function TrainingMembers() {
  const { group, users, training } = useGroup();
  const members = users.filter((user) => group.membersIds.includes(user.uid));

  return (
    <>
      <Stack direction="row" pb={2} px={2}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-start"
          alignItems="center"
          sx={{
            width: '100%',
            maxWidth: 1500,
            borderRadius: 2,
            rowGap: 1,
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            margin: 'auto',
            justifyContent: 'center',
            minHeight:
              group.membersIds && group.membersIds.length > 0 ? 80 : undefined,
          }}
        >
          {members && members.length > 0 ? (
            // Sort members: those in a subgroup first, those without a subgroup last
            [...members].map((member) => {
              if (!member || !training)
                return (
                  <Tooltip key={member.uid} title={member.email}>
                    <Avatar
                      sx={{
                        width: 45,
                        height: 45,
                        border: `3px solid ${undefined}`,
                      }}
                    >
                      {member.email[0].toUpperCase()}
                    </Avatar>
                  </Tooltip>
                );

              // Find the subgroup index
              const subgroupIndex = Object.values(training.subgroups).findIndex(
                (subgroup: any) => subgroup.membersIds.includes(member.uid)
              );

              // assign border color based on the subgroup index
              const borderColor =
                subgroupIndex !== -1
                  ? COLORS[subgroupIndex + (1 % COLORS.length)]
                  : undefined;

              return (
                <Tooltip key={member.uid} title={member.email}>
                  <Avatar
                    sx={{
                      width: 45,
                      height: 45,
                      border: `3px solid ${borderColor}`,
                    }}
                  >
                    {member.email[0].toUpperCase()}
                  </Avatar>
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
