'use client';

import { Stack, Tooltip, Avatar, Typography } from '@mui/material';
import { TrainingMembersProps } from './type';
import { useState } from 'react';
import { TrainingService } from '@/controller/training/training.service';

export default function TrainingMembers(props: TrainingMembersProps) {
  const { training: t, users } = props;
  const [training] = useState(() => TrainingService.mapMembers(t, users));

  return (
    <>
      <Stack direction="row" py={2} px={2}>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-start"
          alignItems="center"
          sx={{
            width: '100%', // Ensure it takes 90% of its parent’s width
            maxWidth: 1500,
            border: '1px solid grey',
            borderRadius: 2,
            rowGap: 1,
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            margin: 'auto',
            justifyContent: 'center',
            minHeight:
              training.membersIds && training.membersIds.length > 0
                ? 80
                : undefined,
          }}
        >
          {training.members && training.members.length > 0 ? (
            // Sort members: those in a subgroup first, those without a subgroup last
            [...training.members]
              /* .sort((a, b) => {
                const aSubgroupIndex = training.subgroups.findIndex(
                  (subgroup: any) => subgroup.membersIds.includes(a.uid)
                );

                const bSubgroupIndex = group.subgroups.findIndex(
                  (subgroup: any) => subgroup.membersIds.includes(b.uid)
                );

                return aSubgroupIndex === -1
                  ? 1
                  : bSubgroupIndex === -1
                    ? -1
                    : aSubgroupIndex - bSubgroupIndex;
              }) */
              .map((member) => {
                if (!member) return null;

                /* // Find the subgroup index
                const subgroupIndex = training.subgroups.findIndex(
                  (subgroup: any) => subgroup.membersIds.includes(member.uid)
                );

                // assign border color based on the subgroup index
                const borderColor =
                  subgroupIndex !== -1
                    ? COLORS[subgroupIndex + (1 % COLORS.length)]
                    : undefined; */

                return (
                  <Tooltip key={member.uid} title={member.email}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        border: `3px solid ${undefined}`, // Apply the border color
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
