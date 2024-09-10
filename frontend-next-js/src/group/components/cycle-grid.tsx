import { Cycle } from '@/group/type/cycle.type';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { formatDate, isDateBetween } from '@/common/service/util/date.util';
import { subDays } from 'date-fns';
import dayjs from 'dayjs';

interface Props {
  cycles: Cycle[];
  onClick: (cycle: Cycle) => void;
}

const DATE_RANGE = 30;
const dates = Array.from({ length: DATE_RANGE }, (_, i) => {
  // today is the middle date in the array
  // first date is today - (length / 2)
  // last date is today + (length / 2)
  return dayjs(subDays(new Date(), DATE_RANGE / 2 - i));
});

export default function CycleGrid(props: Props) {
  const { onClick, cycles } = props;

  // filter out cycles that are not within the date range
  const filtered = cycles.filter(cycle => {
    return dates.some(date => isDateBetween(date, cycle.startDate, cycle.endDate));
  });

  return (
    <Box display="flex" flexWrap="wrap">
      {/* 30 days of cards for cycle day */}
      {dates.map((date, i) => (
        <Box key={i}>
          <Card
            variant="outlined"
            sx={{
              margin: 1,
              cursor: 'pointer',
              bgcolor: date.toDate().toDateString() === new Date().toDateString() ? 'primary.main' : 'background.paper',
            }}
          >
            <CardContent>
              <Typography variant="h6">
                {formatDate(date)}
              </Typography>

              {/* Loop through all cycles */}
              {filtered.map((cycle, j) => (
                <Box key={j} display="flex" alignItems="center">
                  {isDateBetween(date, cycle.startDate, cycle.endDate) && (
                    <>
                      <Box
                        sx={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          bgcolor: `#${cycle.color}`,
                          marginRight: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        onClick={() => onClick(cycle)}
                      >
                        {cycle.name}
                      </Typography>
                    </>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}