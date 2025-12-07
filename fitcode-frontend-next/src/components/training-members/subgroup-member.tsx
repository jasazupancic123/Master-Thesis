import { useSortable } from '@dnd-kit/sortable';
import { Avatar, Box, Tooltip } from '@mui/material';

import { updateSelectedAthleteSubgroup } from './actions/actions-subgroups';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

interface Props {
  member: AuthUser;
  subgroup: Subgroup;
  activeMember: AuthUser | null;
}

export default function SubgroupMember(props: Props) {
  const { member, subgroup, activeMember } = props;

  const { users } = useMain();
  const trainerDayViewContext = useTrainerDayView();

  const { training, component, selectedAthlete } = trainerDayViewContext;

  const { attributes, listeners, setNodeRef } = useSortable({
    id: member.uid,
  });

  return (
    <Box
      key={`${member.uid}`}
      ref={activeMember ? undefined : setNodeRef}
      {...listeners}
      {...attributes}
    >
      <Box
        key={`${subgroup.id}-${member.uid}-tooltip`}
        sx={{ p: 0, m: 0 }}
        onClick={() => {
          updateSelectedAthleteSubgroup(member, subgroup.id, {
            ...trainerDayViewContext,
            training,
            component,
          });
        }}
        borderRadius={selectedAthlete === member ? '50%' : 0}
        border={
          selectedAthlete === member
            ? `2px solid ${theme.palette.primary.main}`
            : 'none'
        }
        zIndex={1000}
      >
        <Tooltip
          title={member.email}
          sx={{ mx: 1, my: '0px !important', p: 0 }}
        >
          <Avatar
            className="avatar-border"
            src={
              users.find((m) => m.uid === member.uid)?.photoURL ||
              USER_AVATAR_IMG_URL
            }
            sx={{
              width: 50,
              height: 50,
              m: selectedAthlete === member ? 0.25 : 0.5,
              filter: 'grayscale(100%)',
            }}
          ></Avatar>
        </Tooltip>
      </Box>
    </Box>
  );
}
