import { useAthlete } from '@/store/athlete.provider';
import { Box, IconButton, Typography } from '@mui/material';
import TrainingReportCard from '../athlete/training-report-card';
import { useTrainings } from '@/store/trainings.provider';
import { useState } from 'react';
import { TrainingReport } from '@/core/training/type/training-report.type';
import { ExpandLessOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import { theme } from '@/app/style';

export default function AthleteReports() {
  const { reports } = useTrainings();

  const [filteredReports, setFilteredReports] = useState<TrainingReport[]>(
    reports.length ? [reports[0]] : []
  );

  const loadMoreReports = () => {
    const currentLength = filteredReports.length;
    const moreReports = reports.slice(currentLength, currentLength + 1);
    setFilteredReports([...filteredReports, ...moreReports]);
  };

  const showLessReports = () => {
    setFilteredReports(reports.slice(0, 1));
  };

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
    >
      {filteredReports.map((report, i) => (
        <TrainingReportCard key={i} report={report} />
      ))}

      <IconButton
        sx={{ p: 0, m: 0, mt: 1 }}
        onClick={() => {
          if (reports.length > filteredReports.length) {
            loadMoreReports();
            return;
          }

          showLessReports();
        }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={0.5}
          sx={{
            backgroundColor: theme.palette.background.dark,
            borderRadius: 4,
            p: 0.5,
          }}
        >
          {reports.length > filteredReports.length ? (
            <>
              <ExpandMoreOutlined sx={{ fontSize: 12 }} />
              <Typography fontSize={12}>Load more</Typography>
            </>
          ) : (
            <>
              <ExpandLessOutlined sx={{ fontSize: 12 }} />
              <Typography fontSize={12}>Show less</Typography>
            </>
          )}
        </Box>
      </IconButton>
    </Box>
  );
}
