import { Event } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import { CommonService } from '@/common/service/common.service';
import { getComponentIcon } from '@/common/service/util/icons.util';
import type { SetState } from '@/common/type/state.type';
import type { GroupEvent } from '@/controller/group/type/group-event.type';
import type { TrainingComponentWithTrainingId } from '@/controller/training/type/training-component.type';
import { useScreenSize } from '@/store/screen-size.provider';

const commonService = CommonService.instance;

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
      ? getComponentIcon(item.component?.name || '')
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
          {commonService.date.format(item.from, {}, 'HH:mm')}
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
        {commonService.date.format(item.from, {}, 'H:mm')} -{' '}
        {commonService.date.format(item.to, {}, 'H:mm')}
      </Typography>
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        gap={1}
      >
        {isComponent && (
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              width: 4,
              height: 16,
              borderRadius: 5,
            }}
          />
        )}

        <Typography
          fontSize={16}
          sx={{
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
