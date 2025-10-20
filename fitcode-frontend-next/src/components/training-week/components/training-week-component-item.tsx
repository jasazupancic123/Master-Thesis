import { Event } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import type { SetState } from '@/lib/common/type/state.type';
import type { GroupEvent } from '@/core/group/type/group-event.type';
import type { TrainingComponentWithTrainingId } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { useScreenSize } from '@/store/screen-size.provider';

interface TrainerWeekViewItemProps {
  item: TrainingComponentWithTrainingId | GroupEvent;
  setSelectedItem: SetState<
    (TrainingComponentWithTrainingId | GroupEvent) | null
  >;
  setOpenModal: SetState<boolean>;
}

export default function TrainerWeekViewItem(props: TrainerWeekViewItemProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { item, setSelectedItem, setOpenModal } = props;

  const checkIsComponent = (
    item: TrainingComponentWithTrainingId | GroupEvent
  ): item is TrainingComponentWithTrainingId => {
    return (item as TrainingComponentWithTrainingId).supersets !== undefined;
  };

  const isComponent = checkIsComponent(item);

  // MOBILE DESIGN
  if (screenSize.isMobile || screenSize.isSmallTablet) {
    const IconComponent = isComponent
      ? lib.common.component.getIcon(item.component?.name || '')
      : undefined;
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p={0.5}
        gap={0.25}
        sx={{
          backgroundColor: theme.palette.background.light,
          borderRadius: 2,
        }}
        onClick={() => {
          setSelectedItem(item);
          setOpenModal(true);
        }}
      >
        <Typography fontSize={12}>
          {lib.common.date.format(item.from, {}, 'HH:mm')}
        </Typography>
        {isComponent ? (
          IconComponent && <IconComponent style={{ height: 16, width: 16 }} />
        ) : (
          <Event sx={{ fontSize: 16 }} />
        )}
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      sx={{
        p: screenSize.isMobile || screenSize.isSmallTablet ? 0 : 1,
        ':hover': {
          backgroundColor: theme.palette.background.light,
        },
        cursor: 'pointer',
      }}
      onClick={() => {
        setSelectedItem(item);
        setOpenModal(true);
      }}
    >
      <Typography fontSize={12}>
        {lib.common.date.format(item.from, {}, 'H:mm')} -{' '}
        {lib.common.date.format(item.to, {}, 'H:mm')}
      </Typography>
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        gap={0.75}
      >
        {isComponent && (
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              width: 10,
              height: 10,
              borderRadius: '50%',
            }}
          />
        )}

        <Typography
          fontSize={16}
          textAlign="center"
          sx={{
            mt: 0.15,
            textTransform: isComponent ? 'uppercase' : undefined,
            color: isComponent ? theme.palette.primary.main : undefined,
            ml: !isComponent ? 1.66 : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isComponent
            ? item.target
              ? `${item.component?.name} - ${item.target.name}`
              : item.component?.name
            : item.title.length
              ? item.title[0].toUpperCase() + item.title.slice(1)
              : ''}
        </Typography>
      </Box>
      <Typography fontSize={12}>{item.location}</Typography>
    </Box>
  );
}
