import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TrainingDay, { colors } from '@/group/components/training-day';
import Circles from '@/app/groups/components/circles';
import dayjs from 'dayjs';
import { Tooltip } from '@mui/material';
import { GroupPageProps } from '@/group/type/props.type';
import { CommonService } from '@/common/service/common.service';
import Typography from '@mui/material/Typography';

const commonService = CommonService.instance;

export default function TrainerDayView(props: GroupPageProps) {
  const [day, setDay] = useState(commonService.date.getToday());

  const group = props.selected.group;
  const cycle = props.selected.cycle;
  if (!group || !cycle)
    return <Typography variant="body1" mt={2}>No cycle selected</Typography>;
  console.log('group', group);

  return <Box>
    {/* Week day badges */}
    <Circles
      items={commonService.date.getWeekDays().map(({ label, date }) => ({
        label: label[0],
        value: date.toString(),
        sublabel: commonService.date.format(date, { withYear: false }),
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
      getBackgroundColor={(value, itemValue) => commonService.date.isSameDay(dayjs(value), dayjs(itemValue)) ? '#1EB980' : 'rgba(255, 255, 255, 0.1)'}
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
        {([group.id]).concat(group.subgroups.map(({ id }) => id)).map((groupOrSubgroupId, i) => {
          const foundGroup = groupOrSubgroupId === group.id ? group : null;
          const foundSubgroup = groupOrSubgroupId === group.id ? null : group.subgroups.find(s => s.id === groupOrSubgroupId) || null;

          const members = (foundGroup || foundSubgroup || { membersIds: [] }).membersIds.map(id => (group!.members || []).find(m => m.uid === id));

          return <Stack
            key={groupOrSubgroupId}
            direction="row"
            spacing={1}
            my={4}
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              if (group)
                props.setSelected(prev => ({ ...prev, subgroup: null }));
              else
                // props.setSelected(prev => ({ ...prev, subgroup: prev.subgroup === subgroup ? null : subgroup }));
                props.setSelected(prev => ({ ...prev, subgroup: foundSubgroup }));
            }}
          >
            {members.map(member => member && <Box key={member.uid}>
              <Tooltip title={member.email}>
                <Avatar
                  sx={{ border: group ? 0 : `2px solid ${colors[i % colors.length]}` }}
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
    <TrainingDay trainings={cycle.trainings} />
  </Box>;
}