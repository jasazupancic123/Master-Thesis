import { Box, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React, { useState } from 'react';

import type { TrainingReport } from '@/controller/training/type/training-report.type';
import AthleteTrainingCardHeader from './athlete-training-card-header';
import {
  BarPlot,
  ChartContainer,
  ChartsTooltip,
  PieChart,
} from '@mui/x-charts';
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
  const [tonnageScore] = useState(
    Math.round((report.tonnage / report.totalTonnage) * 100)
  );
  const [densityScore] = useState(
    Math.round((report.activeTime / report.recTime) * 100)
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
          <CustomChartContainer label="Realization">
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
              <ChartsTooltip trigger="none" />
              <PieCenterLabel label={`${realizationScore}%`} />
            </PieChart>
          </CustomChartContainer>
          <CustomChartContainer label="Tonnage">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <PieChart
                height={75}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                hideLegend
                series={[
                  {
                    startAngle: -90,
                    endAngle: 90,
                    data: [
                      { label: '', value: tonnageScore },
                      { label: '', value: 100 - tonnageScore },
                    ],
                    innerRadius: 30,
                    outerRadius: 45,
                    cy: 55,
                  },
                ]}
                colors={[
                  theme.palette.primary.main,
                  theme.palette.background.light,
                ]}
              >
                <PieCenterLabel
                  label={`${tonnageScore}kg`}
                  position={{ top: 12 }}
                />
                <ChartsTooltip trigger="none" />
              </PieChart>

              <Typography
                fontSize={12}
                textAlign="center"
                color={theme.palette.background.lightBorder}
              >
                Density
              </Typography>
              <ChartContainer
                height={15}
                series={[
                  { type: 'bar', data: [densityScore], layout: 'horizontal' },
                ]}
                margin={0}
                xAxis={[{ position: 'none', min: 0, max: 100 }]}
                yAxis={[{ position: 'none', scaleType: 'band', data: [''] }]}
                colors={[theme.palette.primary.main]}
                sx={{
                  backgroundColor: theme.palette.background.light,
                }}
              >
                <BarPlot />
                <ChartsTooltip trigger="item" />
              </ChartContainer>
            </Box>
          </CustomChartContainer>
          <Box
            width="32.33%"
            height={133}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={1}
          >
            <CustomValueBox
              value={`${report.totalDuration}’`}
              title="Duration"
            />
            <CustomValueBox value={`72%`} title="Intensity" />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />
    </>
  );
}

const CustomChartContainer = ({
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
        lineHeight={1}
        textAlign="center"
        color={theme.palette.background.lightBorder}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
};

const CustomValueBox = ({ value, title }: { value: string; title: string }) => {
  return (
    <Box
      width={50}
      height={50}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.light,
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: '5px',
      }}
    >
      <Typography fontSize={14} textAlign="center">
        {value}
      </Typography>
      <Typography fontSize={10} textAlign="center">
        {title}
      </Typography>
    </Box>
  );
};
