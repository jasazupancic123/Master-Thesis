import { Box, Grid2, Tooltip, Typography } from '@mui/material';
import { DashboardReportType } from '@/common/enum/dashboard-report-type.enum';
import BorderColor from '../border-color/border-color';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';
import dayjs from 'dayjs';

interface DashboardReportProps {
  name: string;
  color: string;
  reportType: DashboardReportType;
  data?: any;
}

export default function DashboardReport(props: DashboardReportProps) {
  const { name, color, reportType, data } = props;

  const screenSize = useScreenSize();
  const theme = useTheme();
  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        sx={{
          py: 1,
          backgroundColor: color,
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" textTransform="uppercase">
          {name}
        </Typography>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        width="100%"
        alignItems="center"
        bgcolor="background.default"
        textAlign="center"
        gap={reportType === DashboardReportType.FLAGGED_ATHLETES ? 0.5 : 0}
      >
        {(() => {
          switch (reportType) {
            case DashboardReportType.ATTENDANCE: {
              return data.map((item: any, i: number) => (
                <Box
                  key={i}
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  sx={{ px: screenSize.isSmallerThanLaptop ? 1 : 5, py: 1 }}
                  bgcolor="background.paper"
                >
                  <Tooltip title={item.displayName} placement="top">
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.displayName}
                    </Typography>
                  </Tooltip>
                  <Typography
                    variant="body1"
                    sx={{
                      transform:
                        item.attendance.value.toString().length === 1
                          ? 'translateX(-25%)'
                          : undefined,
                    }}
                  >
                    {item.attendance.positive
                      ? `${item.attendance.value.toString()}%`
                      : `-${item.attendance.value.toString()}%`}
                  </Typography>
                </Box>
              ));
            }
            case DashboardReportType.CYCLE_PROGRESS: {
              return data.map((item: any, i: number) => (
                <Grid2
                  key={i}
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  sx={{
                    px: screenSize.isSmallerThanLaptop ? 1 : 5,
                    py: 1,
                  }}
                  bgcolor="background.paper"
                  container
                >
                  <Grid2 size={6} textAlign="left">
                    <Tooltip title={item.displayName} placement="left">
                      <Typography
                        variant="body1"
                        noWrap
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.displayName}
                      </Typography>
                    </Tooltip>
                  </Grid2>

                  <Grid2 size={3} textAlign="center">
                    <Typography variant="body1">
                      {item.progress.positive
                        ? `${item.progress.value.toString()}%`
                        : `-${item.progress.value.toString()}%`}
                    </Typography>
                  </Grid2>
                  <Grid2 size={3} textAlign="right">
                    {item.progress.positive ? (
                      <ArrowUpward sx={{ color: theme.palette.primary.main }} />
                    ) : (
                      <ArrowDownward sx={{ color: theme.palette.error.main }} />
                    )}
                  </Grid2>
                </Grid2>
              ));
            }
            case DashboardReportType.FLAGGED_ATHLETES: {
              return data.map((item: any, i: number) => (
                <Box
                  key={i}
                  display="flex"
                  flexDirection="column"
                  width="100%"
                  bgcolor="background.paper"
                  sx={{ py: 1 }}
                >
                  <Typography variant="body1" textAlign="center" sx={{ pb: 1 }}>
                    {item.displayName}
                  </Typography>
                  <Typography
                    variant="body1"
                    textAlign="center"
                    color={theme.palette.error.main}
                  >
                    {item.info}
                  </Typography>
                </Box>
              ));
            }
            case DashboardReportType.TODAYS_SESSIONS: {
              if (!data)
                return (
                  <Box
                    display="flex"
                    justifyContent="center"
                    width="100%"
                    bgcolor="background.paper"
                    textAlign="center"
                    py={1}
                  >
                    No sessions for today
                  </Box>
                );
              return data.map((item: any, i: number) => {
                return (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="center"
                    width="100%"
                    bgcolor="background.paper"
                    py={1}
                  >
                    <Typography>{`${item.name} (${dayjs(
                      item.session.from
                    ).format(
                      'hh:mm A'
                    )}, ${item.session.location})`}</Typography>
                  </Box>
                );
              });
            }
            default: {
              return <></>;
            }
          }
        })()}
      </Box>
      {/* items here */}
      <BorderColor color={color} lower />
    </Box>
  );
}
