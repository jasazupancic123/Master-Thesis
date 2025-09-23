import { Box, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React, { useState } from 'react';

import type { TrainingReport } from '@/controller/training/type/training-report.type';
import AthleteTrainingCardHeader from './athlete-training-card-header';
import { PieChart } from '@mui/x-charts';
import { PieCenterLabel } from '@/common/util/mui-charts.util';
import { ChildrenProps } from '@/common/type/props.type';
import { theme } from '@/app/style';

type TrainingReportCardProps = {
  report: TrainingReport;
};

export default function TrainingReportCard(props: TrainingReportCardProps) {
  const theme = useTheme();
  const { report } = props;

  const [realizationScore] = useState(
    Math.round((report.realizationScore / report.totalRealizationScore) * 100)
  );

  return (
    <>
      <Box
        id="training-report-card"
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{
          px: 2,
          py: 2,
          backgroundColor: theme.palette.background.default,
        }}
        gap={2}
      >
        {/* Group name, cycle name, date */}
        <AthleteTrainingCardHeader
          components={report.mappedPlannedComponents || []}
          group={report.group}
          cycle={report.cycle}
          from={report.from}
          to={report.to}
        />

        {/* Report charts */}
        <Box width="100%" display="flex" alignItems="flex-start" gap={'1%'}>
          <ChartContainer label="Realization">
            <PieChart
              height={120}
              hideLegend
              series={[
                {
                  data: [
                    {
                      value: realizationScore,
                      label: '',
                    },
                    {
                      value: 100 - realizationScore,
                      label: '',
                    },
                  ],
                  innerRadius: 35,
                },
              ]}
              colors={[
                theme.palette.primary.main,
                theme.palette.background.light,
              ]}
            >
              <PieCenterLabel label={`${realizationScore}%`} />
            </PieChart>
          </ChartContainer>
          <ChartContainer label="Tonnage">
            <></>
          </ChartContainer>
          <ChartContainer label="TODO">
            <></>
          </ChartContainer>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />
    </>
  );
}

const ChartContainer = ({
  children,
  label,
}: ChildrenProps & { label: string }) => {
  return (
    <Box
      width="32.33%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
    >
      <Typography
        fontSize={12}
        textAlign="center"
        color={theme.palette.background.lightBorder}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
};
