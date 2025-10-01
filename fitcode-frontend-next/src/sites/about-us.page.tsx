'use client';

import { Box, Typography } from '@mui/material';

import { HERO_NAVBAR_HEIGHT } from '@/app/state';
import { theme } from '@/app/style';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { useScreenSize } from '@/store/screen-size.provider';

export default function AboutUsPage() {
  const screenSize = useScreenSize();

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent={
        screenSize.isSmallerThanLaptop ? 'flex-end' : 'flex-start'
      }
    >
      <HeroNavbar height={HERO_NAVBAR_HEIGHT} currentView="about-us" />

      {screenSize.isSmallerThanLaptop ? (
        <Box
          height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-evenly"
          sx={{
            backgroundImage: 'url(/about-us-mobile.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            backgroundColor: theme.palette.text.secondary,
          }}
        >
          <Typography
            textAlign="center"
            fontSize={24}
            fontWeight="bold"
            sx={{
              textTransform: 'uppercase',
              color: theme.palette.primary.main,
            }}
          >
            Mission
          </Typography>
          <Typography
            textAlign="center"
            fontSize={18}
            maxWidth={400}
            sx={{
              // text shadow
              textShadow: '0 0 5px rgba(0,0,0,0.3)',
            }}
          >
            We empower coaches with actionable insights and athletes with
            personalized feedback, providing a complete training management
            system that makes preparation smarter, safer, and more effective —
            from planning to performance.
          </Typography>
          <Typography
            textAlign="center"
            fontSize={18}
            fontWeight="bold"
            sx={{
              color: theme.palette.primary.main,
              textShadow: '0 0 15px rgba(0,0,0,0.3)',
            }}
          >
            Blindoff Team
          </Typography>
        </Box>
      ) : (
        <Box
          width="100%"
          height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
          display="flex"
        >
          <Box
            width="33%"
            height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            sx={{
              px: 14,
            }}
            gap={8}
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
              Mission
            </Typography>
            <Typography
              textAlign="center"
              fontSize={18}
              maxWidth={400}
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              We empower coaches with actionable insights and athletes with
              personalized feedback, providing a complete training management
              system that makes preparation smarter, safer, and more effective —
              from planning to performance.
            </Typography>
            <Typography
              textAlign="center"
              fontSize={18}
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Blindoff Team
            </Typography>
          </Box>
          <Box
            width="67%"
            height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="flex-start"
            sx={{
              backgroundImage: 'url(/about-us.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              sx={{ position: 'absolute', bottom: 10, left: 20 }}
              gap={1}
            >
              <Typography
                fontSize={20}
                fontWeight="light"
                lineHeight={1.2}
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'uppercase',
                }}
              >
                Vision
              </Typography>
              <Typography
                fontSize={30}
                lineHeight={1.2}
                fontWeight="bold"
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'uppercase',
                }}
              >
                Transforming how <br /> coaches coach <br /> and how athletes
                train
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
