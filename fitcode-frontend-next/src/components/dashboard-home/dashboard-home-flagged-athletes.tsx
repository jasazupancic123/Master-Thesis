import { alpha, Avatar, Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { theme } from '@/app/style';
import { WellnessChartDataType } from '@/core/profile/enum/wellness-chart-data-type.enum';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function DashboardHomeFlaggedAthletes() {
  const { users, wellness } = useMain();

  const { selectedGroups, selectedInstitution } = useDashboard();

  const LOWER_BOUNDARY = 5; // it it's the same or lower than this, flag the athlete

  const [flaggedWellness, setFlaggedWellness] = useState<
    { userId: string; type: WellnessChartDataType; value: number }[]
  >([]);

  useEffect(() => {
    const newFlaggedWellness: {
      userId: string;
      type: WellnessChartDataType;
      value: number;
    }[] = [];

    wellness
      .filter((tw) => {
        const group = selectedInstitution?.groups?.find((g) =>
          g.membersIds.includes(tw.userId)
        );
        return (
          dayjs(tw.date).isSame(dayjs(), 'day') &&
          group &&
          selectedGroups.some((sg) => sg.id === group.id)
        );
      })
      .forEach((w) => {
        if (typeof w.sleep === 'number' && w.sleep <= LOWER_BOUNDARY)
          newFlaggedWellness.push({
            userId: w.userId,
            type: WellnessChartDataType.SLEEP,
            value: w.sleep,
          });
        if (typeof w.soreness === 'number' && w.soreness <= LOWER_BOUNDARY)
          newFlaggedWellness.push({
            userId: w.userId,
            type: WellnessChartDataType.SORENESS,
            value: w.soreness,
          });
        if (typeof w.fatigue === 'number' && w.fatigue <= LOWER_BOUNDARY)
          newFlaggedWellness.push({
            userId: w.userId,
            type: WellnessChartDataType.FATIGUE,
            value: w.fatigue,
          });
      });

    setFlaggedWellness(newFlaggedWellness.sort((a, b) => a.value - b.value));
  }, [wellness, selectedGroups, selectedInstitution]);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{ p: 1 }}
    >
      {flaggedWellness.map((w) => {
        const user = users.find((u) => u.uid === w.userId);

        if (!user) return null;

        const group = selectedGroups.find((g) =>
          g.membersIds.includes(user.uid)
        );

        if (!group) return null;

        const color =
          w.value <= 2 ? theme.palette.error.main : theme.palette.warning.main;

        return (
          <Box
            key={`${w.userId}-${w.type}`}
            width="100%"
            display="flex"
            alignItems="center"
          >
            <Box
              width="80%"
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              gap={0.5}
            >
              <Avatar
                className="avatar-border"
                src={user.photoURL || USER_AVATAR_IMG_URL}
                sx={{
                  width: 30,
                  height: 30,
                }}
              />
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                justifyContent="center"
                gap={0.5}
              >
                <Typography lineHeight={1} variant="body2" fontSize={16}>
                  {user.displayName}
                </Typography>
                <Typography
                  lineHeight={1}
                  variant="caption"
                  fontSize={12}
                  sx={{ color: alpha(theme.palette.text.primary, 0.5) }}
                >
                  {group.name}
                </Typography>
              </Box>
            </Box>
            <Box
              width="20%"
              minWidth={70}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Box
                width="100%"
                sx={{
                  backgroundColor: alpha(color, 0.1),
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                <Typography
                  lineHeight={1}
                  variant="body2"
                  fontSize={14}
                  textAlign="center"
                  sx={{ color }}
                >
                  {w.value}
                </Typography>
                <Typography
                  lineHeight={1}
                  variant="body2"
                  textAlign="center"
                  fontSize={12}
                  sx={{ color }}
                >
                  {w.type}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
