import { Box, Typography } from '@mui/material';

import { useScreenSize } from '@/store/screen-size.provider';

interface MobileDoubleTextItemsProps {
  item1: {
    label: string;
    value: string | number;
  };
  item2?: {
    label: string;
    value: string | number;
  };
}

export default function MobileDoubleTextItems(
  props: MobileDoubleTextItemsProps
) {
  const screenSize = useScreenSize();

  const { item1, item2 } = props;
  return (
    <Box
      display="flex"
      width="40%"
      justifyContent="center"
      gap={4}
      mt={0.75}
      sx={{
        mx: 'auto',
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        width="50%"
        alignItems="center"
      >
        <Typography
          noWrap
          textAlign="center"
          sx={{
            fontSize: '12px',
            fontWeight: 400,
          }}
        >
          {item1.label}
        </Typography>
        <Typography
          textTransform="uppercase"
          textAlign="center"
          sx={{
            fontSize: screenSize.isSmallerThanLaptop ? '14px' : '16px',
            fontWeight: 600,
          }}
        >
          {item1.value}
        </Typography>
      </Box>
      {item2 && (
        <Box
          display="flex"
          flexDirection="column"
          width="50%"
          alignItems="center"
        >
          <Typography
            noWrap
            textAlign="center"
            sx={{
              fontSize: '12px',
              fontWeight: 400,
            }}
          >
            {item2.label}
          </Typography>
          <Typography
            textAlign="center"
            textTransform="uppercase"
            sx={{
              fontSize: screenSize.isSmallerThanLaptop ? '14px' : '16px',
              fontWeight: 600,
            }}
          >
            {item2.value}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
