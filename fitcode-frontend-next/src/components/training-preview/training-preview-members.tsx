import { Avatar, Box, Typography } from '@mui/material';

import { DEFAULT_SUBGROUP } from '../trainer-group-day-view/constant/subgroups.constant';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useCoachTraining } from '@/store/coach-training.provider';
import { useTrainingPreview } from '@/store/training-preview.provider';

export default function TrainingPreviewMembers() {
  const { training } = useCoachTraining();
  const { selectedComponent } = useTrainingPreview();

  const availableMembers = (training.members || []).filter(
    (m) =>
      !selectedComponent?.subgroups.some((sg) => sg.membersIds.includes(m.uid))
  );

  const subgroups: Subgroup[] = selectedComponent
    ? [
        DEFAULT_SUBGROUP(availableMembers),
        ...(selectedComponent?.subgroups || []),
      ]
    : [
        {
          name: 'Main Group',
          membersIds: training.membersIds,
          supersets: [],
          id: 'main-group',
          members: training.members,
        },
      ];

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      {subgroups.map((subgroup, index) => (
        <Box
          key={`subgroup-box-${subgroup.id}-${index}`}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="flex-start"
          gap={0.5}
        >
          <Box
            key={`subgroup-box-${subgroup.id}-${index}`}
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
          >
            {(subgroup.members || []).map((member) => (
              <Avatar
                key={`member-avatar-${member.uid}`}
                src={member.photoURL || USER_AVATAR_IMG_URL}
                sx={{
                  width: 50,
                  height: 50,
                  cursor: 'pointer',
                  filter: 'grayscale(100%)',
                }}
              />
            ))}
          </Box>
          {selectedComponent && (
            <Typography fontSize={12}>
              {subgroup.name} #{subgroup.membersIds.length}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
