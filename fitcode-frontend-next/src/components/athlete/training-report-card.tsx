import { Box, Divider, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import {
  BarPlot,
  ChartContainer,
  ChartsTooltip,
  PieChart,
} from '@mui/x-charts';
import { differenceInMinutes } from 'date-fns';
import React from 'react';

import AthleteTrainingCardHeader from './athlete-training-card-header';
import { theme } from '@/app/style';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import { PieCenterLabel } from '@/ui/mui-charts';

interface Props {
  report: TrainingReport;
}

export default function TrainingReportCard({ report }: Props) {
  const theme = useTheme();

  const duration = differenceInMinutes(report.from, report.to);
  const realizationScore = Math.round(report.realization * 100);
  const tonnageScore = Math.round((report.tonnage / report.tonnage) * 100) || 0;
  const densityScore =
    Math.round((report.tut / (duration - report.tut)) * 100) || 0;

  const metrics = [
    {
      label: 'Sets',
      completed: report.sets,
      total: report.prescribed.sets,
    },
    {
      label: 'Reps',
      completed: report.reps,
      total: report.prescribed.reps,
    },
    {
      label: 'TUT',
      completed: report.tut,
      total: report.prescribed.tut,
      unit: 's',
    },
    {
      label: 'Recovery',
      completed: report.recTime,
      total: report.prescribed.recTime,
      unit: 's',
    },
    {
      label: 'Tonnage',
      completed: report.tonnage,
      total: report.prescribed.tonnage,
      unit: 'kg',
    },
  ];

  return (
    <>
      <Box
        id="training-report-card"
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{ px: 2, py: 2, backgroundColor: theme.palette.background.default }}
        gap={2}
      >
        {/* Group name, cycle name, date */}
        {report && (
          <AthleteTrainingCardHeader
            report={report}
            components={[]}
            group={report.group}
            cycle={report.cycle}
            from={report.from}
            to={report.to}
          />
        )}

        {/* Report charts */}
        <Box width="100%" display="flex" alignItems="flex-start" gap={'1%'}>
          <CustomChartContainer label="Realization">
            <PieChart
              height={120}
              hideLegend
              series={[
                {
                  data: [
                    { value: realizationScore, label: '' },
                    { value: 100 - realizationScore, label: '' },
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
                    innerRadius: 35,
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
                  label={`${report.tonnage}kg`}
                  position={{ top: 12 }}
                  fontSize={12}
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
            <CustomValueBox value={`${duration}’`} title="Duration" />
            <CustomValueBox value={`72%`} title="Intensity" />
          </Box>
        </Box>
        {/* Bar charts for remaining metrics */}
        <Box
          width="100%"
          display="flex"
          justifyContent="space-around"
          flexWrap="wrap"
          gap={1}
        >
          {metrics.map((metric) => {
            const score =
              metric.total > 0
                ? Math.round((metric.completed / metric.total) * 100)
                : 0;
            return (
              <CustomChartContainer key={metric.label} label={metric.label}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <ChartContainer
                    height={18}
                    series={[
                      {
                        type: 'bar',
                        data: [score],
                        layout: 'horizontal',
                      },
                    ]}
                    margin={0}
                    xAxis={[{ position: 'none', min: 0, max: 100 }]}
                    yAxis={[
                      { position: 'none', scaleType: 'band', data: [''] },
                    ]}
                    colors={[theme.palette.primary.main]}
                    sx={{
                      backgroundColor: theme.palette.background.light,
                      borderRadius: 2,
                      width: '100%',
                    }}
                  >
                    <BarPlot />
                  </ChartContainer>

                  <Typography
                    fontSize={11}
                    color={theme.palette.text.primary}
                    mt={0.5}
                  >
                    {metric.completed}
                    {metric.unit || ''} / {metric.total}
                    {metric.unit || ''}
                  </Typography>
                </Box>
              </CustomChartContainer>
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />
    </>
  );
}

const CustomChartContainer = ({
  children,
  label,
}: React.PropsWithChildren & { label: string }) => {
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
