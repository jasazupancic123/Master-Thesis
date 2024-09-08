import { GroupPageProps } from '@/app/groups/props';
import React, { useState } from 'react';
import { formatDate, getToday, getWeekDays, isSameDay } from '@/common/service/util/date.util';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TrainingDay, { colors } from '@/components/training-day';
import Circles from '@/app/groups/components/circles';
import dayjs from 'dayjs';
import { Tooltip } from '@mui/material';

export default function TrainerDayView(props: GroupPageProps) {
  const [day, setDay] = useState(getToday());

  if (!props.selected.group || !props.selected.cycle)
    return null;

  return <Box>
    {/* Week day badges */}
    <Circles
      items={getWeekDays().map(({ label, date }) => ({
        label: label[0],
        value: date.toString(),
        sublabel: formatDate(date, { withYear: false }),
      }))}
      value={day.date.toString()}
      setValue={(value) => {
        setDay({ label: '', date: dayjs(value) });

        props.setDate({
          start: dayjs(value).startOf('day'),
          end: dayjs(value).endOf('day'),
          custom: true,
        });
      }}
      getBackgroundColor={(value, itemValue) => isSameDay(dayjs(value), dayjs(itemValue)) ? '#1EB980' : 'rgba(255, 255, 255, 0.1)'}
      sx={{
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
      }}
    />

    {/* Group Member Avatars */}
    <Stack
      direction="row"
      p={3}
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        borderBottomRightRadius: '20px',
        borderBottomLeftRadius: '20px',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1}>
        {[props.selected.group].concat(props.selected.group.subgroups || []).map((subgroup, i) => {
          const members = subgroup.memberIds.map(id => (props.selected.group!.members || []).find(m => m.uid === id));
          const isMainGroup = subgroup.id === props.selected.group!.id;

          return <Stack
            key={subgroup.id}
            direction="row"
            spacing={1}
            my={4}
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              if (isMainGroup)
                props.setSelected(prev => ({ ...prev, subgroup: null }));
              else
                props.setSelected(prev => ({ ...prev, subgroup: prev.subgroup === subgroup ? null : subgroup }));
            }}
          >
            {members.map(member => member && <Box key={member.uid}>
              <Tooltip title={member.email}>
                <Avatar
                  sx={{ border: isMainGroup ? 0 : `2px solid ${colors[i % colors.length]}` }}
                >
                  {member.email[0].toUpperCase()}
                </Avatar>
              </Tooltip>
            </Box>)}
          </Stack>;
        })}
      </Stack>
    </Stack>

    {/* Training set groups with set exercises */}
    <TrainingDay trainings={props.selected.trainings} />
  </Box>;
}