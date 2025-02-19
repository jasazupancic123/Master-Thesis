'use client';

import { COLORS } from '@/common/constant/color.constant';
import { useGroup } from '@/context/group-provider';
import { useScreenSize } from '@/context/screen-size-provider';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { User } from '@/controller/user/type/user.type';
import { Avatar, Box, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { handleAddSubgroup } from './state';

interface TrainingMembersProps {
  isSticky: boolean;
}

export default function TrainingMembers(props: TrainingMembersProps) {
  const screenSize = useScreenSize();
  const { isSticky } = props;
  const {
    group,
    users,
    training,
    setSelectedSubgroup,
    component,
    setComponent,
    setTraining,
  } = useGroup();

  const members = users.filter((user) => group.membersIds.includes(user.uid));
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);

  // Sort members:
  // 1. Members without a subgroup come first
  // 2. Members in the same subgroup stay together
  const sortedMembers = [...members].sort((a, b) => {
    if (!training) return 0; // If no training data, return original order

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

    const subgroups = component?.subgroups || [];
    const availableMembers = members.filter(
      (member) =>
        !subgroups.some((subgroup: any) =>
          subgroup.membersIds.includes(member.uid)
        )
    );

    const defaultSubgroup: Subgroup = {
      id: 'default',
      name: 'Default',
      membersIds: availableMembers.map((user) => user.uid),
      supersets: [],
    };

    setSubgroups([defaultSubgroup, ...subgroups]);
  }, [training, component]);

  async function handleRightClickAvatar(member: User) {
    if (!training || !component) return;

    const createSubgroup = {
      name: member.displayName || member.email,
      membersIds: [member.uid],
    };

    const sameSubgroup = component.subgroups.find(
      (subgroup) => subgroup.name === createSubgroup.name
    );

    if (sameSubgroup)
      return toast.error('Subgroup for this member already exists');

    //check if the member already exists in a subgroup and if he does, remove him from that subgroup
    const memberSubgroup = component.subgroups.find((subgroup) =>
      subgroup.membersIds.includes(member.uid)
    );

    if (memberSubgroup) {
      const newSubgroup = {
        ...memberSubgroup,
        membersIds: memberSubgroup.membersIds.filter((id) => id !== member.uid),
      };

      const newSubgroups = component.subgroups.map((subgroup) =>
        subgroup.id === newSubgroup.id ? newSubgroup : subgroup
      );

      const newComponent = { ...component, subgroups: newSubgroups };
      setComponent(newComponent);
      setTraining({
        ...training,
        components: training.components.map((c) =>
          c.id === newComponent.id ? newComponent : c
        ),
      });
    }

    await handleAddSubgroup({
      training,
      setTraining,
      component: component!,
      setComponent,
      createSubgroup,
      setCreateSubgroup: undefined,
    });
  }

  if (!component) return null;

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
            py: isSticky ? 0 : 2,
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
            px: 0,
            boxShadow: isSticky ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
            border: isSticky ? '1px solid grey' : 'none',
          }}
        >
          {/* No members to display*/}
          {!training && sortedMembers.length === 0 && (
            <Typography variant="caption" color="textSecondary">
              No available members
            </Typography>
          )}

          {/* Training/component is not selected yet, display the members normally */}
          {!training &&
            sortedMembers.length > 0 &&
            sortedMembers.map((member) => {
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
            })}

          {training &&
            subgroups.map((subgroup, subgroupIndex) => {
              if (subgroup.membersIds.length === 0) return null;
              // Assign border color based on the subgroup index
              const borderColor =
                subgroupIndex > 0
                  ? COLORS[subgroupIndex % COLORS.length]
                  : 'transparent';

              return (
                <div
                  key={subgroup.id}
                  onClick={(event) => {
                    const BORDER_WIDTH = 2; // Match the border width

                    // Get the bounding box of the div
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    // Check if the click is within the border region
                    const isBorderClick =
                      x < BORDER_WIDTH ||
                      x > rect.width - BORDER_WIDTH ||
                      y < BORDER_WIDTH ||
                      y > rect.height - BORDER_WIDTH;

                    if (subgroupIndex > 0)
                      setSelectedSubgroup({
                        subgroup: subgroup || null,
                        index: subgroupIndex - 1,
                      });
                    else if (subgroupIndex === 0) setSelectedSubgroup(null);
                  }}
                  style={{
                    display: 'inline-block',
                    border:
                      subgroupIndex > 0
                        ? `2px solid ${borderColor}`
                        : '2px solid transparent',
                    borderTopLeftRadius: 7,
                    borderTopRightRadius: 7,
                    backgroundColor: '#283444',
                    cursor: 'pointer',
                    margin: '5px',
                  }}
                >
                  <Box
                    display="flex"
                    flexDirection="row"
                    sx={{ backgroundColor: '#283444', borderRadius: 10 }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      sx={{
                        pr: 1.5,
                        backgroundColor: '#283444',
                        borderTopLeftRadius: 10,
                      }}
                      height={screenSize.isMobile ? 55 : 70}
                    >
                      {/* First Typography (Green Box) */}
                      <Box
                        height={20}
                        sx={{
                          backgroundColor: '#1EB980',
                          textAlign: 'center',
                          display: 'flex', // Center content inside
                          flex: 1, // Fill remaining space
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderTopLeftRadius: 5,
                        }}
                        width={20}
                      >
                        <Typography
                          variant="caption"
                          sx={{ textAlign: 'center', color: 'white' }}
                        >
                          {`G${subgroupIndex + 1}`}
                        </Typography>
                      </Box>

                      {/* Second Typography (Member Count) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center', // Centers text
                          flex: 1, // Fill remaining space
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ textAlign: 'center' }}
                        >
                          {subgroup.membersIds.length}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      key={subgroup.id}
                      sx={{
                        pr: 0.5,
                        py: 0,
                        pl: 0,
                        borderRadius: 2,
                        backgroundColor: '#283444',
                      }}
                      display="flex"
                      flexWrap="wrap"
                      justifyContent="center"
                      alignItems="center" // Ensure children stretch to full height
                      height="100%" // Make this box take full height
                    >
                      {subgroup.membersIds.map((memberId) => {
                        const member = members.find(
                          (user) => user.uid === memberId
                        );

                        if (!member) return null;

                        return (
                          <Tooltip
                            key={member.uid}
                            title={member.email}
                            sx={{ mx: 1, p: 0 }}
                          >
                            <Box
                              onContextMenu={(event) => {
                                event.preventDefault(); // prevent default right-click menu
                                handleRightClickAvatar(member);
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <Avatar
                                className="avatar-border"
                                src="/user_avatar.png" // Path to the image in the public folder
                                sx={{
                                  width: screenSize.isMobile ? 40 : 50,
                                  height: screenSize.isMobile ? 40 : 50,
                                  mx: 0.5,
                                  my: 1,
                                }}
                              >
                                {/* {member.email[0].toUpperCase()} */}
                              </Avatar>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                </div>
              );
            })}
        </Stack>
      </Stack>
    </>
  );
}
