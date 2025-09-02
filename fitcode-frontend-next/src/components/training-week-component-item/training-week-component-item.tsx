import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

import { CommonService } from '@/common/service/common.service';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useScreenSize } from '@/store/screen-size-provider';

const commonService = CommonService.instance;

interface TrainerWeekComponentItemProps {
  component: TrainingComponent;
}

export default function TrainerWeekComponentItem(
  props: TrainerWeekComponentItemProps
) {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { component } = props;

  if (screenSize.isMobile || screenSize.isSmallTablet) {
    const IconComponent = commonService.navigation.getComponentIcon(
      component.component?.name || ''
    );
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
      >
        <Typography fontSize={12}>
          {commonService.date.format(component.from, {}, 'HH:mm')}
        </Typography>
        {IconComponent && <IconComponent sx={{ fontSize: 16 }} />}
      </Box>
    );
  }
  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
    >
      <Typography fontSize={12}>
        {commonService.date.format(component.from, {}, 'H:mm')} -{' '}
        {commonService.date.format(component.to, {}, 'H:mm')}
      </Typography>
      <Box
        width="100%"
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        gap={1}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            width: 4,
            height: 16,
            borderRadius: 5,
          }}
        />
        <Typography
          fontSize={16}
          sx={{
            textTransform: 'uppercase',
            color: theme.palette.primary.main,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {component.target
            ? `${component.component?.name} - ${component.target.name}`
            : component.component?.name}
        </Typography>
      </Box>
    </Box>
  );
}
