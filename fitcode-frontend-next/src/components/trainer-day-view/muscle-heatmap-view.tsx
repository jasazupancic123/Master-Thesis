import { Box, Grid2, IconButton, TextField } from '@mui/material';
import { useTheme } from '@mui/material';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from 'recharts';
import Image from 'next/image';
import { useScreenSize } from '@/context/screen-size-provider';
import { Close } from '@mui/icons-material';

const data = [
  { time: '', value: 0 },
  { time: '15:00', value: 300 },
  { time: '30:00', value: 500 },
  { time: '45:00', value: 200 },
  { time: '60:00', value: 800 },
  { time: '75:00', value: 600 },
  { time: '90:00', value: 900 },
  { time: '105:00', value: 700 },
];

type DataPoint = {
  time: string;
  value: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: { payload: DataPoint; value: number }[];
};

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#2a2a2a',
          padding: '8px',
          borderRadius: '5px',
          color: '#fff',
        }}
      >
        <p>{`Time: ${payload[0].payload.time}`}</p>
        <p>{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

interface MuscleHeatmapViewProps {
  setHeatmapView: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MuscleHeatmapView(props: MuscleHeatmapViewProps) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  return (
    <>
      <Grid2
        size={12}
        direction={screenSize.isSmallerThanLaptop ? 'column' : 'row'}
        container
        gap={1}
        sx={{
          position: 'relative',
        }}
      >
        <IconButton
          sx={{ p: 0, m: 0, position: 'absolute', right: 0 }}
          onClick={() => props.setHeatmapView(false)}
        >
          <Close />
        </IconButton>
        <Grid2
          size={screenSize.isSmallerThanLaptop ? 12 : 5.5}
          sx={{
            ml: screenSize.isMobile
              ? 3
              : screenSize.isSmallerThanLaptop
                ? '1%'
                : 0,
          }}
        >
          <Grid2 container size={12}>
            <Grid2 size={9}>
              <Image
                src="/bodyHeat_2.png"
                alt="HeatMap"
                layout="responsive" // Ensures it scales correctly
                width={100} // Placeholder value
                height={50} // Placeholder value (adjust based on aspect ratio)
              />
            </Grid2>
            <Grid2 size={2}>
              <Box
                display="flex"
                flexDirection="column"
                width="100%"
                justifyContent="center"
                alignItems="center"
              >
                <TextField
                  variant="standard"
                  value="5.5"
                  sx={{
                    mt: screenSize.isMobile ? 3 : 0,
                  }}
                  InputProps={{
                    sx: {
                      fontSize: 20,
                      textAlign: 'center',
                      color: 'hsl(0, 0.00%, 79.20%)',
                      '& input': {
                        textAlign: 'center', // Center the text inside
                      },
                      '&:before': {
                        borderBottom: `1px solid ${theme.palette.primary.main}`, // Default underline color
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottom: `1px solid ${theme.palette.primary.main}`, // Hover color
                      },
                      '&:after': {
                        borderBottom: `1px solid ${theme.palette.primary.main}`, // Focused underline color
                      },
                    },
                  }}
                />
                <Image
                  src="/bodyHeatTable.png"
                  alt="HeatMap"
                  layout="responsive"
                  width={100} // Placeholder value
                  height={50} // Placeholder value (adjust based on aspect ratio)
                  style={{ marginTop: 10 }}
                />
              </Box>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2
          size={screenSize.isSmallerThanLaptop ? 12 : 6}
          sx={{ mt: !screenSize.isSmallerThanLaptop ? 3 : 0 }}
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00aaff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#00aaff"
                fillOpacity={1}
                fill="url(#colorUv)"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
              />
              <Scatter
                data={data}
                dataKey="value"
                fill="#fff"
                stroke="#000"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Grid2>
      </Grid2>
    </>
  );
}
