import dayjs from 'dayjs';

import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { Avatar, Box, Grid2, Typography } from '@mui/material';
import { MetricConfig } from './types/wellness-metrics.type';
import WellnessBarChart from './wellness-bar-chart';
import { useScreenSize } from '@/store/screen-size.provider';
import { MAX_WIDTH_NUMERIC } from '../trainer-group-day-view/constant/dimensions.constant';
import { theme } from '@/app/style';
import { WellnessZScore } from '@/core/profile/type/wellness.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

type Props = {
  groupId?: string;
  selectedUserId?: string;
};

export default function WellnessReports(props: Props) {
  const screenSize = useScreenSize();

  const { wellness } = useMain();
  const { selectedInstitution } = useDashboard();

  const { groupId, selectedUserId } = props;

  const group = selectedInstitution?.groups?.find((g) => g.id === groupId);
  const members = selectedUserId
    ? (group?.members || []).filter((m) => m.uid === selectedUserId)
    : group?.members || [];

  const todaysWellness = wellness.filter((w) => {
    return dayjs(w.date).isSame(dayjs(), 'day');
  });

  const metricConfigs: MetricConfig[] = [
    { key: 'sleep', zKey: 'zScoreSleep', title: 'Sleep' },
    { key: 'fatigue', zKey: 'zScoreFatigue', title: 'Fatigue' },
    { key: 'soreness', zKey: 'zScoreSoreness', title: 'Soreness' },
  ];

  const barChartWidth =
    typeof window !== undefined && window !== undefined
      ? screenSize.xs || screenSize.sm
        ? Math.min(450, window.innerWidth * 0.85)
        : Math.min(window.innerWidth, MAX_WIDTH_NUMERIC) * 0.4
      : 450;
  const barChartHeight = barChartWidth * 0.5;

  const comments = todaysWellness.filter(
    (w) => w.comment && w.comment.trim() !== ''
  );

  return (
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
        flexDirection="column"
        alignItems="center"
        gap={0.25}
      >
        <Typography variant="h6" lineHeight={1}>
          Daily Wellness Analysis
        </Typography>
        <Typography component="span" textAlign="center" lineHeight={1}>
          Historical data comparison{' ('}
          <Typography
            component="span"
            sx={{
              color: theme.palette.success.main,
            }}
          >
            Typical
          </Typography>
          {', '}
          <Typography
            component="span"
            sx={{
              color: theme.palette.warning.main,
            }}
          >
            +1SD
          </Typography>
          {', '}
          <Typography
            component="span"
            sx={{
              color: theme.palette.error.main,
            }}
          >
            +2SD
          </Typography>
          {', '}
          <Typography
            component="span"
            sx={{
              color: theme.palette.primary.main,
            }}
          >
            Not enough data
          </Typography>
          {')'}
        </Typography>
      </Box>
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <WellnessBarChart
            todaysWellness={todaysWellness}
            metricConfig={metricConfigs[0]}
            width={barChartWidth}
            height={barChartHeight}
            members={members}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <WellnessBarChart
            todaysWellness={todaysWellness}
            metricConfig={metricConfigs[1]}
            width={barChartWidth}
            height={barChartHeight}
            members={members}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <WellnessBarChart
            todaysWellness={todaysWellness}
            metricConfig={metricConfigs[2]}
            width={barChartWidth}
            height={barChartHeight}
            members={members}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          {/* Title */}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{
              borderRadius: 2,
              mx: 'auto',
            }}
          >
            <Box
              width={barChartWidth * 1.1}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderTopRightRadius: 8,
                borderTopLeftRadius: 8,
              }}
            >
              <Typography
                variant="h6"
                textAlign="center"
                lineHeight={1}
                sx={{
                  py: 1,
                  textTransform: 'uppercase',
                }}
              >
                Comments
              </Typography>
            </Box>
            <Box
              width={barChartWidth * 1.1}
              display="flex"
              flexDirection="column"
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderTop: 'none',
                borderRadius: 2,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                p: 2,
                mx: 'auto',
                overflowY: 'auto',
                maxHeight: 348,
              }}
              gap={2}
            >
              {comments.length === 0 ? (
                <Typography textAlign="center">No comments</Typography>
              ) : (
                comments.map((c) => {
                  const user = members.find((m) => m.uid === c.userId);

                  if (!user) return null;

                  return (
                    <Box
                      key={c.userId}
                      width="100%"
                      display="flex"
                      alignItems="center"
                    >
                      <Avatar
                        src={user.photoURL || USER_AVATAR_IMG_URL}
                        sx={{ width: 40, height: 40, mr: 1 }}
                      />
                      <Typography
                        fontSize={14}
                        sx={{ wordBreak: 'break-word' }}
                      >
                        <strong>
                          {user.displayName || user.email || 'Unknown'}
                        </strong>
                        {': '}
                        {c.comment}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  );
}
