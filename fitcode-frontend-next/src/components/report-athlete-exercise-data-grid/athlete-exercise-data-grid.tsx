import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';

import AthleteExerciseDataGridHeader from './athlete-exercise-data-grid-header';
import useAthleteExerciseReportDataGridData from './hooks/use-rows';
import { theme } from '@/app/style';
import type { Training } from '@/core/training/type/training.type';
import type { Workload } from '@/core/training/type/workload.type';
import type { User } from '@/core/user/type/user.type';

interface Props {
  cache: Map<string, Workload[]>;
}

export default function AthleteExerciseDataGrid(props: Props) {
  const { cache } = props;

  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

  const { isLoadingData, rows, columns } = useAthleteExerciseReportDataGridData(
    selectedAthlete,
    selectedTraining,
    cache
  );

  return (
    <Box
      width="96%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="center"
      sx={{
        borderRadius: 2,
        p: 1.5,
        backgroundColor: theme.palette.background.divider,
      }}
      gap={1}
    >
      <AthleteExerciseDataGridHeader
        selectedAthlete={selectedAthlete}
        setSelectedAthlete={setSelectedAthlete}
        selectedTraining={selectedTraining}
        setSelectedTraining={setSelectedTraining}
      />
      {/* 👇 The actual datagrid */}
      <Box width="100%">
        {isLoadingData ? (
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            mt={1}
          >
            <CircularProgress size="20px" />
            <Typography>Loading data...</Typography>
          </Box>
        ) : (
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            getRowId={(row) => row.exerciseId}
            density="compact"
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
            }}
          />
        )}
      </Box>
    </Box>
  );
}
