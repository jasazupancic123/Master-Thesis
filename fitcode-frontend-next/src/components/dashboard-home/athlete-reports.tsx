import { ExpandLessOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

import TrainingReportCard from '../athlete/training-report-card';
import { theme } from '@/app/style';
import type { TrainingReport } from '@/core/training/type/training-report.type';
import { useAthlete } from '@/store/athlete.provider';

export default function AthleteReports() {
  const { reports } = useAthlete();

  const [filteredReports, setFilteredReports] = useState<TrainingReport[]>(
    reports.data.length ? [reports.data[0]] : []
  );

  const loadMoreReports = () => {
    const currentLength = filteredReports.length;
    const moreReports = reports.data.slice(currentLength, currentLength + 1);
    setFilteredReports([...filteredReports, ...moreReports]);
  };

  const showLessReports = () => {
    setFilteredReports(reports.data.slice(0, 1));
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

      {reports.data.length > 1 && (
        <IconButton
          sx={{ p: 0, m: 0, mt: 1 }}
          onClick={() => {
            if (reports.data.length > filteredReports.length) {
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
            {reports.data.length > filteredReports.length ? (
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
      )}
    </Box>
  );
}
