'use client';

import { useScreenSize } from '@/store/screen-size-provider';
import { Groups, PersonAddAlt, Remove } from '@mui/icons-material';
import {
  Avatar,
  Grid2,
  IconButton,
  ToggleButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Cycle } from '@/controller/group/type/cycle.type';
import { useDashboard } from '@/store/dashboard-provider';
import { useRouter } from 'next/navigation';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { isManager } from '@/common/service/util/firebase-auth.util';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import toast from 'react-hot-toast';

const AVATAR_SIZE = 45;

interface DashboardStaffGroupsCyclesProps {
  setModal: SetState<{ add_trainer: boolean; add_group: boolean }>;
}

export default function DashboardStaffGroupsCycles(
  props: DashboardStaffGroupsCyclesProps
) {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const router = useRouter();

  const {
    token,
    users,
    profile,
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const { setModal } = props;

  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(
    selectedGroup?.cycles[0] || null
  );

  if (!selectedInstitution) return null;

  const role = profile.customClaims.role || [];

  useEffect(() => {
    if (
      !selectedInstitution.groups ||
      !selectedInstitution.groups.length ||
      (selectedGroup &&
        !selectedInstitution.groupIds.includes(selectedGroup?.id))
    ) {
      setSelectedGroup(null);
      setSelectedCycle(null);
    }
  }, [selectedInstitution]);

  const handleRemoveTrainerFromInstitution = (trainerId: string) => {
    if (!selectedInstitution) return;

    handleApiRequest(
      router,
      () =>
        InstitutionController.removeTrainers(token, selectedInstitution.id, {
          trainerIds: [trainerId],
        }),
      (institution) => {
        institution = InstitutionService.mapUsers(
          [institution],
          users || []
        )[0];
        setSelectedInstitution(institution);
        toast.success('Trainer removed successfully');
      },
      undefined,
      'Failed to remove trainer'
    );
  };

  return (
    <Grid2
      container
      size={12}
      gap={2}
      wrap="nowrap"
      direction={screenSize.isMobile ? 'column' : 'row'}
    >
      <Grid2 size={screenSize.isMobile ? 12 : 6} sx={{ position: 'relative' }}>
        <Grid2
          container
          size={12}
          direction="column"
          sx={{
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: '10px',
            pb: 4,
          }}
        >
          <Grid2 size={2} width="100%" display="flex" justifyContent="center">
            <ToggleButton
              value={'STAFF'}
              disableRipple
              disabled
              sx={{
                width: '33%',
                px: 5,
                py: 0.5,
                color: '#fff',
                backgroundColor: theme.palette.primary.main,
                borderBottomLeftRadius: '80px',
                borderBottomRightRadius: '80px',
                border: 'none',
                '&:disabled': { color: '#fff' },
                textTransform: 'none',
              }}
            >
              STAFF
            </ToggleButton>
          </Grid2>
          <Grid2 size={10} width="100%">
            <Grid2 container size={12}>
              <Grid2 size={4}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={1}
                >
                  <Typography variant="body1">OWNER</Typography>
                  <Tooltip
                    title={selectedInstitution.owner?.displayName || ''}
                    placement="top"
                  >
                    <Avatar
                      className="avatar-border"
                      src={'/user_avatar.png'}
                      sx={{
                        width: screenSize.isMobile ? 70 : 90,
                        height: screenSize.isMobile ? 70 : 90,
                      }}
                    />
                  </Tooltip>
                </Box>
              </Grid2>
              <Grid2
                size={8}
                display="flex"
                flexWrap="wrap"
                columnGap={4}
                rowGap={0}
                maxHeight={150}
                overflow="auto"
              >
                {selectedInstitution &&
                  selectedInstitution.trainers &&
                  selectedInstitution.trainers.map((trainer) => (
                    <Box
                      key={trainer.uid}
                      display="flex"
                      flexDirection="column"
                      justifyContent="flex-start"
                      gap={1}
                      py={2}
                    >
                      <Tooltip title={trainer.displayName} placement="top">
                        <Box
                          key={trainer.uid}
                          sx={{
                            position: 'relative',
                            display: 'inline-block',
                            margin: '0 5px',
                            '&:hover .remove-icon': {
                              opacity: 1,
                            },
                          }}
                        >
                          <Avatar
                            className="avatar-border"
                            src="/user_avatar.png"
                            sx={{
                              width: 42,
                              height: 42,
                            }}
                          />
                          {isManager(role) && (
                            <IconButton
                              className="remove-icon"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTrainerFromInstitution(trainer.uid);
                              }}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                opacity: 0, // hidden by default
                                backgroundColor: theme.palette.error.main,
                                zIndex: 1,
                              }}
                            >
                              <Remove sx={{ fontSize: 10 }} />
                            </IconButton>
                          )}
                        </Box>
                      </Tooltip>
                    </Box>
                  ))}
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
      <Grid2 size={screenSize.isMobile ? 12 : 6}>
        <Grid2
          container
          size={12}
          direction="column"
          gap={1}
          sx={{ position: 'relative' }}
        >
          {isManager(role) && (
            <Tooltip title="Add group" placement="top">
              <IconButton
                disableRipple
                onClick={() =>
                  setModal({ add_trainer: false, add_group: true })
                }
                sx={{
                  p: 0,
                  m: 0,
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 100,
                }}
              >
                <Groups />
              </IconButton>
            </Tooltip>
          )}

          <Grid2
            size={6}
            display="flex"
            width="100%"
            overflow="auto"
            maxHeight="100% !important"
            sx={{
              position: 'relative',
              backgroundColor: theme.palette.background.paper,
              px: 1,
              py: 0.5,
              borderTopRightRadius: '10px',
              borderTopLeftRadius: '10px',

              scrollbarWidth: 'thin',
              scrollbarColor: '#515b68 transparent',
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'background.default',
              },
            }}
          >
            {!selectedInstitution.groups?.length ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                width="100%"
                sx={{ height: 85 }}
              >
                <Typography variant="h6">No groups yet</Typography>
              </Box>
            ) : (
              selectedInstitution.groups.map((group) => {
                const name = group.name || ''; // Ensure group.name exists
                const isFirstTwoNumbers = /^\d{2}/.test(name); // Check if first two characters are numbers
                const displayText = isFirstTwoNumbers
                  ? name.slice(0, 3)
                  : name.slice(0, 2);

                return (
                  <IconButton
                    disableRipple
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      if (group.cycles.length === 0) setSelectedCycle(null);
                      else setSelectedCycle(group.cycles[0]);
                    }}
                    sx={{
                      p: 0,
                      m: 0,
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      maxWidth={100}
                    >
                      <Tooltip title={group.name} placement="top">
                        <Avatar
                          sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            m: 1,
                            bgcolor: 'primary.dark', // Set background color in case there's no image
                            border:
                              selectedGroup?.id === group.id
                                ? `3px solid ${theme.palette.primary.main}`
                                : undefined,
                            color: '#fff',
                            fontSize: 15,
                          }}
                        >
                          {displayText.toUpperCase()}
                        </Avatar>
                      </Tooltip>
                      <Typography
                        variant="body1"
                        noWrap
                        sx={{
                          maxWidth: '100px', // Adjust as needed
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {group.name}
                      </Typography>
                    </Box>
                  </IconButton>
                );
              })
            )}
          </Grid2>
          <Grid2
            size={6}
            display="flex"
            overflow="auto" // Hide scrollbar
            width="100%"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              px: 1,
              py: 0.5,

              scrollbarWidth: 'thin',
              scrollbarColor: '#515b68 transparent',
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'background.default',
              },
            }}
          >
            {!selectedGroup || !selectedGroup?.cycles.length ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                width="100%"
                sx={{
                  height: 85,
                }}
              >
                <Typography variant="h6">No cycles yet</Typography>
              </Box>
            ) : (
              selectedGroup?.cycles.map((cycle) => {
                const displayText = cycle.name.slice(0, 2);

                return (
                  <IconButton
                    disableRipple
                    key={cycle.id}
                    onClick={() => setSelectedCycle(cycle)}
                    sx={{
                      p: 0,
                      m: 0,
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      maxWidth={100}
                    >
                      <Tooltip title={cycle.name} placement="top">
                        <Avatar
                          sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            m: 1,
                            bgcolor: 'primary.dark',
                            border:
                              selectedCycle?.id === cycle.id
                                ? `3px solid ${theme.palette.primary.main}`
                                : undefined,
                            color: '#fff',
                            fontSize: 15,
                          }}
                        >
                          {displayText.toUpperCase()}
                        </Avatar>
                      </Tooltip>
                      <Typography
                        variant="body1"
                        noWrap
                        sx={{
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cycle.name}
                      </Typography>
                    </Box>
                  </IconButton>
                );
              })
            )}
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  );
}
