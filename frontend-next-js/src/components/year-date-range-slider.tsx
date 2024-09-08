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
    // disabled
    valueLabelDisplay="auto"
    valueLabelFormat={(value) => dayjs().dayOfYear(value).format('MMM DD')}
    min={yearStart.dayOfYear()}
    max={yearEnd.dayOfYear()}
    step={1}
    /*marks={[
      { value: yearStart.dayOfYear(), label: yearStart.format('MMM DD') },
      { value: yearEnd.dayOfYear(), label: yearEnd.format('MMM DD') },
    ]}*/
    value={[props.date[0].dayOfYear(), props.date[1].dayOfYear()]}
    /*onChange={(_, value) => {
      props.setDate([dayjs(yearStart).dayOfYear(value[0]), dayjs(yearStart).dayOfYear(value[1])]);
    }}*/
  />;
}