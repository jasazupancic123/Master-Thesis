import { MoreVert } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import { useScreenSize } from '@/store/screen-size-provider';

interface GroupInfoProps {
  group: Group;
  week?: number;
  cycle?: Cycle;
  smallDisplay?: boolean;
  disableMoreVert?: boolean;
}

export default function GroupCycleInfo(props: GroupInfoProps) {
  const screenSize = useScreenSize();

  const { group, week, cycle, smallDisplay, disableMoreVert } = props;

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent={smallDisplay ? 'center' : 'flex-end'}
      gap={screenSize.isSmallerThanLaptop ? 0 : 4}
      position="relative"
    >
      <Box display="flex" flexDirection="column" mt={1}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems={
            screenSize.isMobile || screenSize.isSmallTablet
              ? 'center'
              : 'flex-end'
          }
          justifyContent="flex-start"
          gap={0.5}
          sx={{
            px: smallDisplay ? 2 : undefined,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={500}
            textAlign={smallDisplay ? 'center' : 'right'}
            fontSize={12}
            sx={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {group.name}
          </Typography>
          {week && cycle && (
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign={smallDisplay ? 'center' : 'right'}
              fontSize={12}
              sx={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Week {week} / {cycle?.name || 'No cycle'}
            </Typography>
          )}
        </Box>
      </Box>
      {!disableMoreVert && (
        <Box
          display="flex"
          flexDirection="column"
          sx={{
            mt: !smallDisplay ? -1.33 : 0,
            position: smallDisplay ? 'absolute' : undefined,
            right: smallDisplay ? 1 : undefined,
            top: smallDisplay ? 6 : undefined,
          }}
          gap={0.5}
        >
          <IconButton
            sx={{
              p: 0,
              m: 0,
              mt: screenSize.isMobile ? undefined : 2.3,
            }}
          >
            <MoreVert fontSize="medium" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
