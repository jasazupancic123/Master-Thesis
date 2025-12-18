import {
  Avatar,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import type { Group } from '@/core/institution/type/group.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { ModalProps } from '@/lib/common/type/modal-props.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import MyModal from '@/ui/modal';
import { lib } from '@/lib';

interface Props {
  group: Group;
}

export default function AddUserToGroupModal(props: ModalProps & Props) {
  const screenSize = useScreenSize();

  const { institution } = useMain();

  const {
    addGroupMember,
    removeGroupMember,
    addGroupTrainer,
    removeGroupTrainer,
  } = useDashboard();

  const { open, setOpen, group } = props;

  const [search, setSearch] = useState('');

  const [filteredUsers, setFilteredUsers] = useState(
    (institution.trainers || []).concat(institution.athletes || [])
  );

  useEffect(() => {
    setFilteredUsers(
      (institution.trainers || []).concat(institution.athletes || [])
    );
  }, [institution]);

  return (
    <MyModal
      isOpen={open}
      setIsOpen={(open) => setOpen(open)}
      cancelText="Close"
      onCancel={() => setOpen(false)}
      dialogueContentSx={{
        minWidth:
          typeof window !== 'undefined'
            ? Math.min(window.innerWidth * 0.9, 500)
            : 500,
      }}
    >
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <Box
          width="100%"
          display="flex"
          flexDirection={screenSize.isMobile ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <Typography>Add to group</Typography>
          <Typography variant="h6">{group.name}</Typography>
        </Box>
        <TextField
          size="small"
          label="Search User"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 10,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.text.primary,
            },
          }}
        />
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          maxHeight={300}
          sx={{
            overflowY: 'auto',
          }}
          gap={2}
        >
          {filteredUsers
            .sort((a, b) =>
              (a.displayName || '').localeCompare(b.displayName || '')
            )
            .map((user) => {
              if (!user || !user.displayName) return null;

              if (
                search.length &&
                !user.displayName.toLowerCase().includes(search.toLowerCase())
              )
                return null;

              const isIncluded =
                (group.membersIds || []).includes(user.uid) ||
                (group.trainerIds || []).includes(user.uid);

              return (
                <Grid key={user.uid} width="100%" container spacing={1}>
                  <Grid size={1} display="flex" alignItems="center">
                    <Avatar
                      alt={user.displayName || ''}
                      src={user.photoURL || USER_AVATAR_IMG_URL}
                      sx={{
                        width: screenSize.isReallySmall ? 24 : 30,
                        height: screenSize.isReallySmall ? 24 : 30,
                      }}
                    />
                  </Grid>
                  <Grid size={5} display="flex" alignItems="center">
                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.displayName}
                    </Typography>
                  </Grid>
                  <Grid size={3} display="flex" alignItems="center">
                    <Typography>
                      {(institution.trainers || []).some(
                        (t) => t.uid === user.uid
                      )
                        ? 'Coach'
                        : 'Athlete'}
                    </Typography>
                  </Grid>
                  <Grid size={3} display="flex" alignItems="center">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        if (lib.firebase.auth.isAthlete(user.role)) {
                          if (isIncluded)
                            await removeGroupMember(user.uid, group.id);
                          else await addGroupMember(user, group.id);
                        } else if (lib.firebase.auth.isTrainer(user.role)) {
                          if (isIncluded)
                            await removeGroupTrainer(user.uid, group.id);
                          else await addGroupTrainer(user, group.id);
                        }
                      }}
                      sx={{
                        backgroundColor: isIncluded
                          ? theme.palette.background.selectedBackground
                          : undefined,
                        color: isIncluded
                          ? theme.palette.text.primary
                          : undefined,
                      }}
                    >
                      {isIncluded ? 'Remove' : 'Add'}
                    </Button>
                  </Grid>
                </Grid>
              );
            })}
        </Box>
      </Box>
    </MyModal>
  );
}
