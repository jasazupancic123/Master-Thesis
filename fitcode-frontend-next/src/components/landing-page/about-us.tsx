import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { theme } from '@/app/style';
import { lib } from '@/lib';
import {
  ABOUT_US_IMG_URL,
  ASPIRE_LOGO_IMG_URL,
} from '@/lib/common/const/image.const';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';
import { useScreenSize } from '@/store/screen-size.provider';
import IndexPageTitleText from '@/ui/index-page-title-text';

export default function AboutUs() {
  const screenSize = useScreenSize();

  const initialAspireLogoWidth = screenSize.isSmallerThanLaptop ? 75 : 120;

  const texts = {
    mission: 'Mission',
    missionDescription:
      'We empower coaches with actionable insights and athletes with personalized feedback, providing a complete training management system that makes preparation smarter, safer, and more effective — from planning to performance.',
  };

  return screenSize.isMobile ? (
    <Box
      id="about-us"
      width="100%"
      height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      gap={4}
      sx={{
        scrollMarginTop: HERO_NAVBAR_HEIGHT,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100vw', // or any width you want
          maxWidth: 1200, // optional cap
          aspectRatio: '16 / 12', // or set a fixed height instead
          mx: 'auto',
        }}
      >
        <Image
          src={ABOUT_US_IMG_URL}
          alt="About us"
          fill
          priority
          sizes="100vw"
          unoptimized={lib.common.env.unoptimizeImages()}
          style={{ objectFit: 'cover' }}
        />

        <IndexPageTitleText
          sx={{
            textAlign: 'right',
            position: 'absolute',
            top: '10%',
            right: '5%',
            fontSize: 14,
          }}
        >
          Transforming how
          <br />
          coaches coach
          <br />
          and how
          <br />
          athletes train
        </IndexPageTitleText>
        <IndexPageTitleText
          sx={{
            textAlign: 'right',
            position: 'absolute',
            top: '70%',
            left: '50%',
            fontSize: 14,
            fontWeight: 200,
          }}
        >
          Vision
        </IndexPageTitleText>
      </Box>
      <Typography
        textAlign="center"
        fontSize={20}
        fontWeight="bold"
        sx={{
          textTransform: 'uppercase',
          color: theme.palette.text.secondary,
        }}
      >
        {texts.mission}
      </Typography>
      <Typography
        textAlign="center"
        width="70%"
        fontSize={16}
        sx={{
          color: theme.palette.text.secondary,
          mx: 'auto',
        }}
      >
        {texts.missionDescription}
      </Typography>
    </Box>
  ) : (
    <Box
      id="about-us"
      width="100%"
      height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
      display="flex"
      alignItems="center"
      sx={{
        overflow: 'hidden',
        scrollMarginTop: HERO_NAVBAR_HEIGHT,
      }}
    >
      <Box
        width="36%"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <Typography
          textAlign="center"
          fontSize={24}
          fontWeight="bold"
          sx={{
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
          }}
        >
          {texts.mission}
        </Typography>
        <Typography
          textAlign="center"
          fontSize={18}
          maxWidth={400}
          sx={{
            color: theme.palette.text.secondary,
            px: 2,
          }}
        >
          {texts.missionDescription}
        </Typography>
      </Box>
      <Box
        width="64%"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
        sx={{
          backgroundImage: `url(${ABOUT_US_IMG_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <Image
          src={ASPIRE_LOGO_IMG_URL}
          alt="Aspire"
          width={initialAspireLogoWidth}
          height={0}
          unoptimized={lib.common.env.unoptimizeImages()}
          style={{
            height: 'auto',
            position: 'absolute',
            left: '19%',
            bottom: '41%',
            transform: 'translate(-50%, 50%)',
          }}
        />
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{
            position: 'absolute',
            top: '15%',
            right: '2.5%',
            textAlign: 'right',
          }}
        >
          <IndexPageTitleText sx={{ fontWeight: 400 }}>
            Vision
          </IndexPageTitleText>
          <IndexPageTitleText sx={{}}>
            Transforming how
            <br />
            coaches coach
            <br />
            and how
            <br />
            athletes train
          </IndexPageTitleText>
        </Box>
      </Box>
    </Box>
  );
}
