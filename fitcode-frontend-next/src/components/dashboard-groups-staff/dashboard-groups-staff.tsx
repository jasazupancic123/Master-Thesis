'use client';

import { useScreenSize } from '@/store/screen-size-provider';
import { Groups, MoreVert, PersonAddAlt, Remove } from '@mui/icons-material';
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
import { GroupController } from '@/controller/group/group.controller';
import HorizontalItemsList from '../horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '../trainer-day-view/constant';
import { useMain } from '@/store/main-provider';

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
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const { setModal } = props;

  const { profile } = useMain();

  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(
    selectedGroup?.cycles[0] || null
  );

  if (!selectedInstitution) return null;

  const role = profile.customClaims.role || [];

  useEffect(() => {
    async function fetchGroups() {
      if (!selectedInstitution || selectedInstitution.groups) return;

      selectedInstitution.groups = await GroupController.findAllByInstitution(
        selectedInstitution.id
      );

      if (
        !selectedInstitution.groups ||
        !selectedInstitution.groups.length ||
        (selectedGroup &&
          !selectedInstitution.groups
            .map((g) => g.id)
            .includes(selectedGroup?.id))
      ) {
        setSelectedGroup(null);
        setSelectedCycle(null);
      }
    }

    fetchGroups().then();
  }, [selectedInstitution]);

  const handleRemoveTrainerFromInstitution = (trainerId: string) => {
    if (!selectedInstitution) return;

    handleApiRequest(
      router,
      () =>
        InstitutionController.removeTrainers(selectedInstitution.id, {
          trainerIds: [trainerId],
        }),
      (institution) => {
        setSelectedInstitution((prev) => {
          if (!prev) return null;
          const updatedTrainers = prev.trainers.filter(
            (trainer) => trainer.uid !== trainerId
          );
          return { ...prev, trainers: updatedTrainers };
        });
        toast.success('Trainer removed successfully');
      },
      undefined,
      'Failed to remove trainer'
    );
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        <>
          <HorizontalItemsList
            dashboardView
            items={
              selectedInstitution?.groups.map((group) => ({
                label: group.name,
                value: group.id,
              })) || []
            }
            value={selectedGroup?.id || ''}
            setValue={(value) => {
              const group = selectedInstitution?.groups.find(
                (g) => g.id === value
              );
              if (group) {
                setSelectedGroup(group);
                setSelectedCycle(group.cycles[0] || null);
              } else {
                setSelectedGroup(null);
                setSelectedCycle(null);
              }
            }}
            checkIsSameValue={(value: string) => {
              return selectedGroup?.id === value;
            }}
            alertOnChange
            onArrowClick={(direction) => {}}
          />
          <Box width="100%" sx={{ position: 'relative' }}>
            <Box
              width="80%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt={1}
              sx={{ mx: 'auto', mb: 1 }}
            >
              <Typography
                fontWeight={600}
                fontSize={16}
                textAlign="center"
                sx={{
                  textTransform: 'uppercase',
                }}
              >
                {selectedGroup?.name || 'Select A Group'}
              </Typography>
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 1,
                }}
              >
                <MoreVert fontSize="medium" />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          alignItems="flex-start"
        >
          <Box
            width="25%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
            sx={{
              mt: 1,
            }}
          >
            <Box
              sx={{
                height: 16,
                width: 4,
                borderRadius: 5,
                backgroundColor: theme.palette.primary.main,
              }}
            />

            <Typography
              fontWeight={600}
              fontSize={16}
              sx={{
                textTransform: 'uppercase',
              }}
            >
              {selectedGroup?.name || 'Select A Group'}
            </Typography>
          </Box>
          <Box width="50%">
            <HorizontalItemsList
              dashboardView
              items={
                selectedInstitution?.groups.map((group) => ({
                  label: group.name,
                  value: group.id,
                })) || []
              }
              value={selectedGroup?.id || ''}
              setValue={(value) => {
                const group = selectedInstitution?.groups.find(
                  (g) => g.id === value
                );
                if (group) {
                  setSelectedGroup(group);
                  setSelectedCycle(group.cycles[0] || null);
                } else {
                  setSelectedGroup(null);
                  setSelectedCycle(null);
                }
              }}
              checkIsSameValue={(value: string) => {
                return selectedGroup?.id === value;
              }}
              alertOnChange
              onArrowClick={(direction) => {}}
            />
          </Box>
          <Box width="25%" display="flex" justifyContent="flex-end" mt={1}>
            <IconButton sx={{ m: 0, p: 0 }}>
              <MoreVert fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
