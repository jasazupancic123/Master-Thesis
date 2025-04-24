import { Avatar, Box, Grid2, Slider, Typography } from '@mui/material';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';

interface SelectedMemberReportProps {
  groupMembers: any[];
}

const data = [
  {
    name: 'Attendance',
    present: 60,
    late: 20,
    absent: 10,
    unmarked: 10,
  },
];

const wellnessData = [
  { name: 'SORENESS', main: 6 },
  { name: 'FATIGUE', main: 8 },
  { name: 'SLEEP', main: 10 },
];

const COLORS: Record<string, string> = {
  SORENESS: '#72deff',
  FATIGUE: '#ffcf44',
  SLEEP: '#ff6859',
};

export default function SelectedMemberReport(props: SelectedMemberReportProps) {
  const { groupMembers } = props;
  const screenSize = useScreenSize();
  const { selectedAthlete, setShowAthleteReport } = useTrainerDayViewContext();

  const [range, setRange] = useState<number[]>([1, 10]); // Example range

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };
  return (
    <Grid2
      container
      direction={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
      width={screenSize.isSmallerThanLaptop ? '100%' : '70%'}
      display="flex"
      alignItems="center"
      px={screenSize.isSmallerThanLaptop ? 0 : 7}
      mt={screenSize.isSmallerThanLaptop ? 2 : 0}
      position="relative"
    >
      <Grid2
        size={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Avatar
          className="avatar-border"
          src={
            groupMembers.find((m) => m.id === selectedAthlete?.uid)
              ?.profileImageUrl || '/user_avatar.png'
          }
          sx={{
            width: screenSize.isMobile ? 40 : 50,
            height: screenSize.isMobile ? 40 : 50,
          }}
        >
          {/* {member.email[0].toUpperCase()} */}
        </Avatar>
      </Grid2>
      <Grid2
        size={screenSize.isSmallerThanLaptop ? 12 : 5}
        mt={screenSize.isSmallerThanLaptop ? 1 : 0}
      >
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          width="100%"
          alignItems="center"
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            width="100%"
            height="100%"
          >
            {!screenSize.isSmallerThanLaptop && (
              <Typography
                variant="caption"
                color="textSecondary"
                textTransform="uppercase"
              >
                Attendance
              </Typography>
            )}
            <ResponsiveContainer width="75%" height={50}>
              <BarChart layout="vertical" data={data}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" hide />
                <RechartsTooltip
                  wrapperStyle={{
                    fill: 'none !important',
                    border: 'none !important',
                    outline: 'none !important',
                    zIndex: 1000,
                  }}
                />
                <Bar
                  dataKey="present"
                  stackId="a"
                  fill="#79d1fc"
                  radius={[10, 0, 0, 10]}
                />
                <Bar dataKey="late" stackId="a" fill="#FFD34E" />
                <Bar dataKey="absent" stackId="a" fill="#FF6565" />
                <Bar
                  dataKey="unmarked"
                  stackId="a"
                  fill="black"
                  radius={[0, 10, 10, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {screenSize.isSmallerThanLaptop && (
              <Typography
                variant="caption"
                color="textSecondary"
                textTransform="uppercase"
              >
                Attendance
              </Typography>
            )}
          </Box>
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Slider
              value={range}
              onChange={handleChange}
              valueLabelDisplay="off"
              min={1}
              max={10}
              step={1}
              sx={{
                pb: '0 !important',
                width: '80%',
                color: 'background.default',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#fff', // Green dots
                  border: '2px solid black',
                  width: 15,
                  height: 15,
                },
                '& .MuiSlider-track': {
                  height: 5,
                  backgroundColor: 'black',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'white',
                  height: 5,
                  opacity: 1,
                },
              }}
            />
            <Box display="flex" justifyContent="space-between" width="80%">
              <Typography variant="body2">1st training</Typography>
              <Typography variant="body2">last</Typography>
            </Box>
          </Box>
        </Box>
      </Grid2>
      <Grid2
        size={screenSize.isSmallerThanLaptop ? 10 : 5}
        height="100%"
        pt={2}
      >
        <Box height="100%" width="100%">
          <ResponsiveContainer width="100%" height={125}>
            <BarChart data={wellnessData}>
              <XAxis
                dataKey="name"
                stroke="#FFFFFF"
                tick={{ fill: '#FFFFFF', fontSize: 12 }}
              />
              <YAxis hide domain={[0, 10]} />
              <RechartsTooltip wrapperStyle={{ outline: 'none' }} />
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                horizontalPoints={[5, 22.5, 40, 57.5, 75]}
              />
              <Bar dataKey="main" stackId="a" barSize={20}>
                {Object.values(COLORS).map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Bar>
              <Bar dataKey="extra" stackId="a" fill="#FFD34E" />
              <Bar dataKey="top" stackId="a" fill="#FFFFFF" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid2>
      <Box
        position="absolute"
        top={screenSize.isSmallerThanLaptop ? 0 : 10}
        right={screenSize.isSmallerThanLaptop ? 20 : 100}
        onClick={() => setShowAthleteReport(false)}
        sx={{ cursor: 'pointer' }}
      >
        <CloseIcon />
      </Box>
    </Grid2>
  );
}
