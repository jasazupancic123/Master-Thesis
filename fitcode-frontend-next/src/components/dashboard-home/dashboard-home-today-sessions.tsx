import { theme } from '@/app/style';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { alpha, Box, SvgIcon, Typography } from '@mui/material';
import dayjs from 'dayjs';

export default function DashboardHomeTodaySessions() {
  const { selectedGroups, trainings } = useDashboard();

  const todayComponents: (TrainingComponent & {
    groupId: string | undefined;
  })[] = trainings
    .filter((training) =>
      selectedGroups.some((group) => group.id === training.groupId)
    )
    .filter((t) => dayjs(t.from).isSame(dayjs(), 'day'))
    .flatMap((training) =>
      training.components.map((component) => ({
        ...component,
        groupId: training.groupId,
      }))
    );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{ p: 1 }}
    >
      {todayComponents.map((component, i) => {
        const IconComponent = lib.common.component.getIcon(component.id);

        const group = selectedGroups.find((g) => g.id === component.groupId);

        return (
          <Box
            key={`${component.id}-${i}`}
            width="100%"
            display="flex"
            alignItems="center"
          >
            <Box width="80%" display="flex" alignItems="center" gap={1}>
              {IconComponent && (
                <SvgIcon
                  component={IconComponent as React.ElementType} // handles SvgIconComponent or your SvgC
                  inheritViewBox
                  sx={{
                    fontSize: 20,
                    color: theme.palette.text.primary,
                    // force shapes inside the svg to use currentColor
                    '& path, & rect, & circle, & polygon, & ellipse, & line, & polyline':
                      {
                        fill: 'currentColor',
                        stroke: 'currentColor',
                      },
                  }}
                />
              )}
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Typography
                  lineHeight={1}
                  fontSize={16}
                  sx={{ textTransform: 'uppercase' }}
                >
                  {component.id}
                </Typography>
                <Typography
                  lineHeight={1}
                  fontSize={12}
                  color={alpha(theme.palette.text.primary, 0.5)}
                >
                  {group?.name}
                </Typography>
              </Box>
            </Box>
            <Box width="20%" display="flex" justifyContent="flex-end">
              <Typography fontSize={12}>
                {dayjs(component.from).format('HH:mm')}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
