import { User } from '@/controller/user/type/user.type';
import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import { COLOR } from '@/common/constant/browser.constant';
import { useDashboard } from '@/store/dashboard-provider';
import { useTheme } from '@mui/material';
import { Remove } from '@mui/icons-material';
import { handleApiRequest } from '@/common/type/state.type';
import { useRouter } from 'next/navigation';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import toast from 'react-hot-toast';
import { isManager } from '@/common/service/util/firebase-auth.util';

interface DashboardAthleteProps {
  athlete: User;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
}

export default function DashboardAthlete(props: DashboardAthleteProps) {
  const theme = useTheme();
  const router = useRouter();

  const { athlete, selectedUser, setSelectedUser } = props;

  const {
    token,
    users,
    profile,
    selectedInstitution,
    setSelectedInstitution,
    selectedGroup,
    setSelectedGroup,
  } = useDashboard();

  const role = profile?.customClaims?.role || [];

  const handleRemoveAthleteFromInstitution = (athleteId: string) => {
    if (!selectedInstitution) return;

    handleApiRequest(
      router,
      () =>
        InstitutionController.removeAthletes(token, selectedInstitution.id, {
          athleteIds: [athleteId],
        }),
      (institution) => {
        institution = InstitutionService.mapUsers([institution], users)[0];
        setSelectedInstitution(institution);
        toast.success('Athlete removed successfully');
      },
      undefined,
      'Failed to remove athlete'
    );
  };

  if (!selectedInstitution) return null;

  return (
    <Tooltip key={athlete.uid} title={athlete.displayName || athlete.email}>
      <Box
        key={athlete.uid}
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
          src={'/user_avatar.png'}
          sx={{
            width: 50,
            height: 50,
            border:
              selectedUser?.uid === athlete.uid ? `2px solid ${COLOR[0]}` : '',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (
              !selectedGroup ||
              !selectedGroup.membersIds.includes(athlete.uid)
            ) {
              const group = selectedInstitution.groups.find((group) =>
                group.membersIds.includes(athlete.uid)
              );
              if (group) setSelectedGroup(group);
            }

            if (selectedUser?.uid === athlete.uid) {
              setSelectedUser(null);
              return;
            }

            setSelectedUser(athlete);
          }}
        />
        {isManager(role) && (
          <IconButton
            className="remove-icon"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAthleteFromInstitution(athlete.uid);
            }}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              opacity: selectedUser?.uid === athlete.uid ? 1 : 0,
              backgroundColor: theme.palette.error.main,
              zIndex: 1,
            }}
          >
            <Remove sx={{ fontSize: 10 }} />
          </IconButton>
        )}
      </Box>
    </Tooltip>
  );
}
