'use client';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import {
  Card,
  CardContent,
  CardMedia,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import Footer from '@/components/footer';
import {
  features,
  highlights,
  products,
  team,
  trademark,
} from '@/common/constant/hero-data.constant';
import Stack from '@mui/material/Stack';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import Button from '@mui/material/Button';
import React, { ReactNode } from 'react';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import { LINKS_NAVBAR } from '@/common/constant/navigation.constant';
import HeroNavbar from '@/components/hero-navbar';
import { buttonStyle, theme, titleStyle } from '@/app/style';
import { AppPageProps } from './type';
import { useTheme } from '@mui/material';

function Section(props: AppPageProps) {
  const theme = useTheme();
  const { title, description, id, children } = props;

  return (
    <Box id={id} p={8} sx={{ backgroundColor: 'black' }}>
      <Container
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 3, sm: 6 },
        }}
      >
        {/* Title */}
        <Box
          sx={{
            width: { sm: '100%', md: '60%' },
            textAlign: { sm: 'left', md: 'center' },
          }}
        >
          <Typography component="h2" variant="h4">
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            {description}
          </Typography>
        </Box>

        {children}
      </Container>
    </Box>
  );
}

export default function Home() {
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);

  return (
    <>
      <HeroNavbar />

      {/* Hero */}
      <Box
        id={LINKS_NAVBAR.index.id}
        sx={{
          width: '100%',
          height: '100vh',
          position: 'relative',
          backgroundSize: '100% 5%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            backgroundColor: 'black',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'translate(-50%, -50%)',
              zIndex: -1, // Ensure the video stays in the background
            }}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        </Box>

        <Container
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              component="span"
              variant="h3"
              sx={{
                fontWeight: 'bold',
                fontFamily: 'Roboto',
                color: '#9FDAFF',
                fontSize: '3rem',
              }}
            >
              PRACTICE PERFECTED BY TECHNOLOGY
            </Typography>

            <br />

            <Typography
              component="span"
              variant="h4"
              sx={{
                fontWeight: 'bold',
                fontFamily: 'Roboto',
                color: '#FFF',
                fontSize: '2.0rem',
              }}
            >
              Unleash Your Performance
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Solutions */}
      <Section
        title={LINKS_NAVBAR.solutions.label}
        description="We are fusing technology into various fitness segments."
        id={LINKS_NAVBAR.solutions.id}
      >
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={10} md={8}>
            <Paper elevation={3} sx={titleStyle}>
              <Typography
                component="h3"
                variant="h5"
                color="text.primary"
                sx={{ mb: 2 }}
              >
                FitCode Pro
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Are you involved in competitive sports, where precision to
                detail is a game-changer? Do you want to gain a comprehensive
                understanding of every aspect of your athletes&apos; training
                process? We offer a complete tool to gain insight into the
                training load of your team or individual athletes. Turn the gym
                blind spot into a well-defined training space with our
                innovative solutions.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={buttonStyle}>
                    <Typography component="h4" variant="h6" color="inherit">
                      Teams
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={buttonStyle}>
                    <Typography component="h4" variant="h6" color="inherit">
                      Individuals
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={10} md={8}>
            <Paper elevation={3} sx={titleStyle}>
              <Typography
                component="h3"
                variant="h5"
                color="text.primary"
                sx={{ mb: 2 }}
              >
                FitCode Life
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Unleash the ultimate fitness experience for your clients with
                FitCode Life! This innovative training system combines
                cutting-edge technology (think interactive trackers, real-time
                progress monitoring) with a vibrant community, fostering lasting
                program attachment and driving results. Whether seasoned
                athletes or fitness newbies, your clients will be empowered by
                personalized training plans and a supportive environment that
                fuels motivation and celebrates success. FitCode Life: Where
                innovation meets community for lifelong wellness.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={buttonStyle}>
                    <Typography component="h4" variant="h6" color="inherit">
                      Indoor
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={buttonStyle}>
                    <Typography component="h4" variant="h6" color="inherit">
                      Outdoor
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Section>

      {/* Products */}
      <Section
        title={LINKS_NAVBAR.products.label}
        description="Discover the State-of-The-Art Tools."
        id={LINKS_NAVBAR.products.id}
      >
        <Grid container spacing={2.5}>
          {products.map(({ image, title, description }, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardMedia
                  component="img"
                  image={image}
                  alt={title}
                  sx={{ height: 140 }}
                />

                <CardContent>
                  <Stack direction="column" color="inherit" spacing={1}>
                    {/*<Box sx={{ opacity: '50%' }}>{icon}</Box>*/}

                    <div>
                      <Typography fontWeight="medium" gutterBottom>
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        {description}
                      </Typography>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Divider />

      {/* Features */}
      <Section
        title={LINKS_NAVBAR.features.label}
        description="Start your journey with FitCode and experience the difference our tools can make in your training and performance."
        id={LINKS_NAVBAR.features.id}
      >
        <Grid container spacing={2}>
          {features.map(({ icon, title, description }, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Button
                variant="outlined"
                onClick={() => setSelectedItemIndex(index)}
                sx={{
                  p: 3,
                  height: '100%',
                  background: 'none',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  backgroundColor:
                    selectedItemIndex === index ? 'action.selected' : undefined,
                  borderColor: theme.palette.primary.main,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2.5,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: theme.palette.primary.main }}>{icon}</Box>
                  <Typography
                    color="text.primary"
                    variant="body2"
                    fontWeight="bold"
                  >
                    {title}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ my: 0.5 }}
                  >
                    {description}
                  </Typography>

                  <Link
                    color="primary"
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      '& > svg': { transition: '0.2s' },
                      '&:hover > svg': { transform: 'translateX(2px)' },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Learn more</span>
                    <ChevronRightRoundedIcon
                      fontSize="small"
                      sx={{ mt: '1px', ml: '2px' }}
                    />
                  </Link>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Divider />

      {/* Trademark */}
      <Section
        title={LINKS_NAVBAR.trademark.label}
        description="Discover the Unbeatable Combination of Our Standards."
        id={LINKS_NAVBAR.trademark.id}
      >
        <Grid container spacing={2.5}>
          {trademark.map(({ image, title, description }, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardMedia
                  component="img"
                  image={image}
                  alt={title}
                  sx={{ height: 140 }}
                />
                <CardContent>
                  <Stack direction="column" color="inherit" spacing={1}>
                    {/*<Box sx={{ opacity: '50%' }}>{icon}</Box>*/}

                    <div>
                      <Typography fontWeight="medium" gutterBottom>
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        {description}
                      </Typography>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Divider />

      {/* Highlights */}
      <Section
        title={LINKS_NAVBAR.highlights.label}
        description="Explore why our product stands out: adaptability, durability, user-friendly design, and innovation. Enjoy reliable customer support and precision in every detail."
        id={LINKS_NAVBAR.highlights.id}
      >
        <Grid container spacing={2.5}>
          {highlights.map(({ title, icon }, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Stack
                direction="column"
                color="inherit"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{
                  p: 3,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'grey.800',
                  background: 'transparent',
                  backgroundColor: 'grey.900',
                }}
              >
                <Box sx={{ opacity: '50%' }}>{icon}</Box>
                <Typography fontWeight="medium" gutterBottom>
                  {title}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Divider />

      {/* About */}
      <Section
        title={LINKS_NAVBAR.about.label}
        description='"FitCode bridges the gap between IT services and elite sports. We strive to revolutionize the way athletes move, train, and perform by providing cutting-edge tools to ensure they achieve peak performance."'
        id={LINKS_NAVBAR.about.id}
      >
        <Box
          sx={{
            width: { sm: '100%', md: '60%' },
            textAlign: { sm: 'left', md: 'center' },
            mt: 4,
          }}
        >
          <Typography component="h3" variant="h5" color="text.primary">
            Key Members
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {team.map(({ name, image, position }, i) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={i}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  alt={name}
                  src={image}
                  sx={{ width: 120, height: 120, marginBottom: 2 }}
                />
                <Typography variant="h6" color="text.primary">
                  {name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {position}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Divider />

      <Footer />
    </>
  );
}
