import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import setupChartData from '../selected-member-report/state';
import { theme } from '@/app/style';
import { WellnessChartDataType } from '@/controller/profile/enum/wellness-chart-data-type.enum';
import type { WellnessChartData } from '@/controller/profile/type/wellness.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function SelectedMemberWelness() {
  const screenSize = useScreenSize();
  const { selectedAthlete, wellness } = useTrainerDayViewContext();

  const [wellnessChartData, setWellnessChartData] = useState<
    WellnessChartData[]
  >(
    [
      WellnessChartDataType.SLEEP,
      WellnessChartDataType.SORENESS,
      WellnessChartDataType.FATIGUE,
    ].map((metric) => ({
      metric,
      today: null,
      zScore: null,
    }))
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    setupChartData(wellness, selectedAthlete, setWellnessChartData);
  }, [selectedAthlete]);

  if (!selectedAthlete) return null;

  return (
    <Box
      width={`100%`}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-end"
      gap={0.9}
      sx={{
        px: 3,
      }}
    >
      <Box
        width={70}
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={0.9}
      >
        {wellnessChartData.some((data) => data.today !== null) ? (
          <Box height={120} display="flex" alignItems="flex-end" gap={1.5}>
            {wellnessChartData.map((data) => (
              <Box
                key={data.metric}
                height={data.today ? `${10 * data.today}%` : 0}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  width: 10,
                  borderRadius: 2,
                  display: data.today ? 'block' : 'none',
                }}
              />
            ))}
          </Box>
        ) : (
          <Box
            width="100%"
            height={screenSize.isMobile ? 60 : 133.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{
              transform: screenSize.isMobile ? undefined : 'translateX(-50%)',
            }}
          >
            <Typography textAlign="center" fontWeight="medium" fontSize={12}>
              No wellness today
            </Typography>
          </Box>
        )}
      </Box>
      <Typography
        textAlign="center"
        fontWeight="medium"
        fontSize={12}
        sx={{
          textTransform: 'uppercase',
        }}
      >
        Wellness
      </Typography>
    </Box>
  );
}
