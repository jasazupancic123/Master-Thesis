import { theme } from '@/app/style';
import { Workload } from '@/core/training/type/workload.type';
import { Box, CircularProgress, Typography } from '@mui/material';
import AthleteExerciseDataGridHeader from './athlete-exercise-data-grid-header';
import { useState } from 'react';
import { AuthUser } from '@/core/auth/type/user.type';
import { Cycle } from '@/core/group/type/cycle.type';
import { Training } from '@/core/training/type/training.type';
import { Group } from '@/core/group/type/group.type';
import { DataGrid } from '@mui/x-data-grid';
import useAthleteExerciseReportDataGridData from './hooks/use-rows';

interface Props {
  cache: Map<string, Workload[]>;
}

export default function AthleteExerciseDataGrid(props: Props) {
  const { cache } = props;

  const [selectedAthlete, setSelectedAthlete] = useState<AuthUser | null>(null);
  const [group, setGroup] = useState<Group | null>(null); // LATER CHANGE THIS TO SELECTED GROUP WHEN DASHBOARD WILL HAVE SIDEBAR
  const [selectedCycles, setSelectedCycles] = useState<Cycle[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );

  const { isLoadingData, rows, columns } = useAthleteExerciseReportDataGridData(
    selectedAthlete,
    selectedCycles,
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
        group={group}
        setGroup={setGroup}
        selectedCycles={selectedCycles}
        setSelectedCycles={setSelectedCycles}
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
