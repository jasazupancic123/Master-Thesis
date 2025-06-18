import { Box } from '@mui/material';
import { DashboardReportType } from '@/common/enum/dashboard-report-type.enum';
import { COLOR } from '@/common/constant/browser.constant';
import DashboardReport from '../dashboard-report/dashboard-report';
import { useDashboard } from '@/store/dashboard-provider';

interface ReportsContainerProps {
  index: number;
  reportTypes: DashboardReportType[];
}

export default function ReportsContainer(props: ReportsContainerProps) {
  const { index, reportTypes } = props;

  const { users, selectedInstitution } = useDashboard();

  const colors = COLOR.filter((_, i) => i % 3 === index);
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      alignItems="center"
      gap={1}
    >
      {reportTypes.map((reportType, i) => {
        let data: any[] | null = [];

        switch (reportType) {
          case DashboardReportType.ATTENDANCE: {
            const first7Users = users.slice(0, 7);
            const attendanceValues = [
              {
                value: 23,
                positive: true,
              },
              {
                value: 21,
                positive: true,
              },
              {
                value: 19,
                positive: true,
              },
              {
                value: 5,
                positive: true,
              },
              {
                value: 3,
                positive: true,
              },
              {
                value: 10,
                positive: false,
              },
              {
                value: 20,
                positive: false,
              },
            ];
            data = first7Users.map((user, index) => ({
              ...user,
              attendance: attendanceValues[index],
            }));
            break;
          }
          case DashboardReportType.CYCLE_PROGRESS: {
            const first7Users = users.slice(0, 7);
            const progressValues = [
              {
                value: 23,
                positive: true,
              },
              {
                value: 21,
                positive: true,
              },
              {
                value: 19,
                positive: true,
              },
              {
                value: 5,
                positive: true,
              },
              {
                value: 3,
                positive: true,
              },
              {
                value: 10,
                positive: false,
              },
              {
                value: 20,
                positive: false,
              },
            ];
            data = first7Users.map((user, index) => ({
              ...user,
              progress: progressValues[index],
            }));
            break;
          }
          case DashboardReportType.FLAGGED_ATHLETES: {
            const first2Users = users.slice(0, 2);
            data = first2Users.map((user, index) => ({
              ...user,
              info: index === 0 ? 'Sleep, Quad DOMS' : 'Injury',
            }));
            break;
          }
          case DashboardReportType.TODAYS_SESSIONS: {
            if (!selectedInstitution) return null;
            const sessions = [
              {
                from: new Date().setHours(8, 30, 0, 0),
                location: 'Fitco Gym',
              },
              {
                from: new Date().setHours(9, 0, 0, 0),
                location: 'Luknja',
              },
              {
                from: new Date().setHours(11, 0, 0, 0),
                location: 'Remote',
              },
              {
                from: new Date().setHours(17, 0, 0, 0),
                location: 'Pitch 3',
              },
            ];

            if (selectedInstitution?.groups) {
              for (const group of selectedInstitution?.groups) {
                data.push({
                  ...group,
                  session:
                    sessions[
                      selectedInstitution.groups.indexOf(group) %
                        sessions.length
                    ],
                });
              }
              break;
            }
          }
          default:
            data = null;
        }

        return (
          <DashboardReport
            key={i}
            name={reportType}
            color={colors[i]}
            reportType={reportType}
            data={data}
          />
        );
      })}
    </Box>
  );
}
