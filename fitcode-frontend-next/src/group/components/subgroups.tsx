import { SubgroupProps } from '../type/subgroup.type';
import { useState, useEffect } from 'react';
import { User } from '@/user/type/user.type';
import { Subgroup } from '@/group/entity/subgroup.entity';
import { Box, Typography, Divider, Grid } from '@mui/material';

export function Subgroups(props: SubgroupProps) {
  const [subgroups, setSubgroups] = useState<Subgroup[]>(props.subgroups);
  const [members, setMembers] = useState<User[]>(props.members);

  useEffect(() => {
    setSubgroups(props.subgroups);
  }, [props.subgroups]);

  useEffect(() => {
    setMembers(props.members);
  }, [props.members]);

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <Typography variant="h6" mb={2}>
          Manage Subgroups
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }}>Group Members</Divider>

      {/* Horizontal Scrollable User List */}
      <Box
        display="flex"
        alignItems="center"
        p={1}
        sx={{
          overflowX: 'auto', // Enable horizontal scrolling
          whiteSpace: 'nowrap', // Prevent wrapping
          gap: 2, // Space between avatars
          scrollbarWidth: 'thin', // Firefox
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#aaa',
            borderRadius: '3px',
          },
        }}
      >
        {members.map((member, index) => (
          <Box
            key={member.uid || index} // Key should be on the outermost element
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            minWidth={80}
            minHeight={110} // Ensures uniform height regardless of text length
            p={1}
          >
            <img
              src="/user_avatar.png"
              alt={member.displayName || 'User Avatar'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <Typography
              variant="body2"
              align="center"
              sx={{
                width: '100%',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2, // Limit to 2 lines
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal', // Allow text wrapping for multiple lines
              }}
            >
              {member.displayName}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}
