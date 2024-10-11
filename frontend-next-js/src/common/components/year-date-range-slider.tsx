import { Slider } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';
import dayOfYear from 'dayjs/plugin/dayOfYear';

dayjs.extend(dayOfYear);

interface Props {
  date: [Dayjs, Dayjs];
}

export default function YearDateRangeSlider(props: Props) {
  const yearStart = props.date[0].startOf('year');
  const yearEnd = props.date[1].endOf('year');

  // value is interval in range between 0 and 365 / 366 days
  return <Slider
    sx={{
      color: 'white', // Changes the slider thumb and track to white
      '& .MuiSlider-thumb': {
        borderRadius: '50%',
        border: '2px solid white', // Border around the slider thumb for visibility
      },
      '& .MuiSlider-track': {
        backgroundColor: 'white', // Slider track color
      },
      '& .MuiSlider-rail': {
        backgroundColor: '#ccc', // Background for the slider rail (for better contrast)
      },
      '& .MuiSlider-valueLabel': {
        color: 'white', // Value label color
      },
    }}
    valueLabelDisplay="auto"
    valueLabelFormat={(value) => dayjs().dayOfYear(value).format('MMM DD')}
    min={yearStart.dayOfYear()}
    max={yearEnd.dayOfYear()}
    step={1}
    value={[props.date[0].dayOfYear(), props.date[1].dayOfYear()]}
  />;
}