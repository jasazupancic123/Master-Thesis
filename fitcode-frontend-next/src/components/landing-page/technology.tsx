import { Box, Card, Grid2, Typography } from '@mui/material';
import Image from 'next/image';
import { useRef } from 'react';

import { theme } from '@/app/style';
import { lib } from '@/lib';
import {
  ASPIRE_LOGO_WHITE_IMG_URL,
  TECHNOLOGY_2_IMG_URL,
  TECHNOLOGY_DRILL_RECOGNITION_IMG_URL,
  TECHNOLOGY_IMG_URL,
  TECHNOLOGY_MOBILE_FEEDBACK_IMG_URL,
  TECHNOLOGY_MOVEMENT_TRACKING_IMG_URL,
} from '@/lib/common/const/image.const';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';
import { useScreenSize } from '@/store/screen-size.provider';
import IndexPageTitleText from '@/ui/index-page-title-text';
import Logo from '@/ui/logo';

type Item = { imageUrl: string; title: string; description: string };

export default function Technology() {
  const screenSize = useScreenSize();

  const imageRef = useRef<HTMLImageElement | null>(null);

  const initialAspireLogoWidth = screenSize.isSmallerThanLaptop ? 75 : 120;

  const items: Item[] = [
    {
      imageUrl: TECHNOLOGY_IMG_URL,
      title: 'Athletes registry',
      description:
        'Automated player identification and data capture for consistent monitoring.​',
    },
    {
      imageUrl: TECHNOLOGY_2_IMG_URL,
      title: 'External load detection',
      description: 'Automatic tracking of equipment usage.​​',
    },
    {
      imageUrl: TECHNOLOGY_DRILL_RECOGNITION_IMG_URL,
      title: 'Drill recognition',
      description: 'Real-time recognition of training activities.​',
    },
    {
      imageUrl: TECHNOLOGY_MOVEMENT_TRACKING_IMG_URL,
      title: 'Movement tracking',
      description:
        'Key body joint tracking in team environments for biomechanical analysis and performance​.​',
    },
  ];

  return screenSize.isSmallerThanLaptop ? (
    <Box
      id="technology"
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        scrollMarginTop: HERO_NAVBAR_HEIGHT,
      }}
    >
      <Box
        width="100%"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        display="flex"
        flexDirection="column"
        alignItems={screenSize.isTablet ? 'center' : 'flex-start'}
        sx={{
          px: 4,
          pt: 6,
          backgroundColor: theme.palette.background.default,
        }}
        gap={4}
      >
        <Logo width={200} />
        <IndexPageTitleText
          sx={{
            textAlign: screenSize.isTablet ? 'center' : 'left',
            fontSize: 20,
            lineHeight: 1.1,
          }}
        >
          Automated,
          <br />
          touchless &<br />
          instant by design
        </IndexPageTitleText>
        <IndexPageTitleText
          sx={{
            textAlign: screenSize.isTablet ? 'center' : 'left',
            fontSize: 16,
            textTransform: 'none',
            fontWeight: 200,
            lineHeight: 1.2,
            textWrap: 'normal',
            maxWidth: 400,
          }}
        >
          We provide training feedback through real-time{' '}
          <b>quality insights, performance evaluation</b>, and precise form
          correction during skill development.
        </IndexPageTitleText>
        <Box
          width={'100%'}
          height="50vh"
          sx={{
            backgroundImage: `url(${TECHNOLOGY_MOBILE_FEEDBACK_IMG_URL})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            position: 'relative',
            mt: 'auto',
          }}
        />
      </Box>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          px: 4,
          py: 6,
        }}
        gap={6}
      >
        {items.map((item) => (
          <Box
            key={item.title}
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Box
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <Box
                ref={imageRef}
                className="img"
                component="img"
                src={item.imageUrl}
                alt={item.title}
                sx={{
                  height: '60%',
                  width: 'auto',
                  maxHeight: 140,
                  mx: 'auto',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform .25s ease',
                }}
              />
            </Box>

            <Typography
              textAlign="center"
              fontWeight="bold"
              lineHeight={1}
              sx={{
                maxWidth: imageRef.current ? imageRef.current.width : undefined,
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                my: 'auto',
              }}
            >
              {item.title}
            </Typography>

            <Typography
              textAlign="center"
              lineHeight={1.1}
              fontSize={12}
              fontWeight={600}
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: imageRef.current ? imageRef.current.width : undefined,
                mt: -0.5,
              }}
            >
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  ) : (
    <Box
      id="technology"
      width="100%"
      height={`100vh`}
      display="flex"
      alignItems="center"
      sx={{
        overflow: 'hidden',
      }}
    >
      <Box
        width="36vw"
        height={`100vh`}
        display="flex"
        flexDirection="column"
        justifyContent={screenSize.isDesktop ? 'center' : 'flex-start'}
        alignItems={screenSize.isDesktop ? 'center' : 'flex-start'}
        sx={{
          backgroundColor: theme.palette.background.default,
          pt: HERO_NAVBAR_HEIGHT,
          px: HERO_NAVBAR_HEIGHT,
        }}
        gap={4}
      >
        <Box
          width={`calc(36vw - ${HERO_NAVBAR_HEIGHT} * 2)`}
          height={`calc(100vh / 2)`}
          maxHeight={400}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          alignItems={screenSize.isDesktop ? 'center' : 'flex-start'}
        >
          <Logo width={270} />
          <IndexPageTitleText
            sx={{
              textAlign: screenSize.isDesktop ? 'center' : 'left',
              fontSize: 25,
              lineHeight: 1.1,
            }}
          >
            Automated,
            <br />
            touchless &<br />
            instant by design
          </IndexPageTitleText>
          <IndexPageTitleText
            sx={{
              textAlign: screenSize.isDesktop ? 'center' : 'left',
              fontSize: 22,
              textTransform: 'none',
              fontWeight: 200,
              lineHeight: 1.2,
              textWrap: 'normal',
            }}
          >
            {screenSize.isTablet ? (
              <>
                We provide training feedback throug real-time
                <b> quality insights, performance evaluation</b>, and precise
                form correction during skill development.
              </>
            ) : (
              <>
                {' '}
                We provide training feedback through
                <br />
                real-time{' '}
                <b>
                  quality insights, performance
                  <br />
                  evaluation
                </b>
                , and precise form correction
                <br />
                during skill development.
              </>
            )}
          </IndexPageTitleText>
        </Box>
        <Box
          width={'36vw'}
          maxHeight={300}
          maxWidth={400}
          height="50vh"
          display="flex"
          justifyContent={
            screenSize.isSmallLaptop ? 'flex-start' : 'space-between'
          }
          alignItems="center"
          gap={screenSize.isSmallLaptop ? 0 : 4}
        >
          <Box
            width={'90%'}
            maxWidth={210}
            height="50vh"
            sx={{
              backgroundImage: `url(${TECHNOLOGY_MOBILE_FEEDBACK_IMG_URL})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left',
              position: 'relative',
            }}
          />
          <Image
            src={ASPIRE_LOGO_WHITE_IMG_URL}
            alt="Aspire"
            width={initialAspireLogoWidth}
            height={0}
            unoptimized={lib.common.env.unoptimizeImages()}
            style={{
              height: 'auto',
            }}
          />
        </Box>
      </Box>
      <Grid2
        container
        width="64vw"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        sx={{ pt: HERO_NAVBAR_HEIGHT }}
      >
        {items.map((item, index) => (
          <Grid2
            width="100%"
            key={item.title}
            size={{ xs: 12, md: 6 }}
            sx={{
              width: 'wrap-contet',
              display: 'flex',
              alignItems: screenSize.isSmallLaptop ? 'flex-start' : 'center',
              justifyContent: 'center', // horizontal center
              textAlign: 'center', // (optional) center text inside
            }}
          >
            <Card
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                boxShadow: 'none',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <Box
                  ref={imageRef}
                  className="img"
                  component="img"
                  src={item.imageUrl}
                  alt={item.title}
                  sx={{
                    height: '60%',
                    width: 'auto',
                    maxHeight: 140,
                    mx: 'auto',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform .25s ease',
                  }}
                />
              </Box>

              {/* Meta */}
              <Box sx={{ mt: 1.5 }}>
                <Typography
                  textAlign="left"
                  fontSize={14}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {'( '}
                  {index + 1}
                  {' )'}
                </Typography>

                <Typography
                  textAlign="left"
                  fontWeight="bold"
                  sx={{
                    maxWidth: imageRef.current
                      ? imageRef.current.width
                      : undefined,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  textAlign="left"
                  fontSize={12}
                  fontWeight={600}
                  sx={{
                    color: theme.palette.text.secondary,
                    maxWidth: imageRef.current
                      ? imageRef.current.width
                      : undefined,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
}
