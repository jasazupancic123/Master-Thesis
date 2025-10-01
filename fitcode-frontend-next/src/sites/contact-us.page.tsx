'use client';

import emailjs from '@emailjs/browser';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import toast from 'react-hot-toast';

import { HERO_NAVBAR_HEIGHT } from '@/app/state';
import { theme } from '@/app/style';
import { LINK_INDEX } from '@/common/constant/navigation.constant';
import { BLACK_TEXT_FIELD_STYLE } from '@/common/util/styles.util';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import Logo from '@/components/logo/logo';
import { useScreenSize } from '@/store/screen-size.provider';

export default function ContactUsPage() {
  const router = useRouter();
  const screenSize = useScreenSize();

  const form = useRef<HTMLFormElement | null>(null);

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.current?.email || !form.current?.name || !form.current?.message) {
      toast.error('Please fill in all fields');
      return;
    }

    const data = new FormData(form.current);

    const name = ((data.get('name') as string) || '').trim();
    const email = ((data.get('email') as string) || '').trim();
    const message = ((data.get('message') as string) || '').trim();

    // Basic required checks
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
    const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, form.current, {
        publicKey: PUBLIC_KEY,
      })
      .then(
        () => {
          toast.success('Message sent successfully');
        },
        (error) => {
          if (error.status === 412) {
            toast.error('Please corectly fill in all fields.');
            return;
          }

          toast.error('Failed to send message.');
        }
      );
  };

  return (
    <>
      <Box
        width="100%"
        height="100vh"
        display="flex"
        alignItems="center"
        sx={{
          overflow: 'none',
          backgroundImage: screenSize.isSmallerThanLaptop
            ? 'url(/contact-us.png)'
            : undefined,
          backgroundSize: screenSize.isSmallerThanLaptop ? 'cover' : undefined,
          backgroundPosition: screenSize.isSmallerThanLaptop
            ? 'center'
            : undefined,
        }}
      >
        {/* Image */}
        {!screenSize.isSmallerThanLaptop && (
          <Box
            width={'60%'}
            height="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundImage: 'url(/contact-us.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <Typography
              textAlign="center"
              fontSize={32}
              fontWeight="bold"
              sx={{
                color: theme.palette.primary.main,
                textTransform: 'uppercase',
              }}
            >
              The hardest mistakes to see
              <br />
              are your own.
            </Typography>
          </Box>
        )}

        <Box
          width={screenSize.isSmallerThanLaptop ? '100%' : '40%'}
          height="100vh"
          sx={
            screenSize.isSmallerThanLaptop
              ? {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                }
              : undefined
          }
        >
          <HeroNavbar
            height={HERO_NAVBAR_HEIGHT}
            dissableLogo
            position={!screenSize.isSmallerThanLaptop ? 'static' : undefined}
            currentView="contact-us"
          />

          <Box
            width={'100%'}
            maxWidth={screenSize.isSmallerThanLaptop ? 600 : undefined}
            height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
            display="flex"
            flexDirection="column"
            justifyContent="space-evenly"
            sx={{
              mx: screenSize.isSmallerThanLaptop ? 'auto' : undefined,
            }}
          >
            <Box
              width="100%"
              height={screenSize.isMobile ? '100vh' : undefined}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={10}
              sx={{
                px: screenSize.isMobile ? 0 : 10,
                py: screenSize.isSmallerThanLaptop ? 10 : undefined,
                backgroundColor: screenSize.isSmallerThanLaptop
                  ? theme.palette.primary.main
                  : undefined,
              }}
            >
              <Box
                onClick={() => {
                  router.push(LINK_INDEX.href);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <Logo width={200} version="dark" />
              </Box>
              <form ref={form} onSubmit={sendEmail} style={{ width: '100%' }}>
                <Box
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  gap={1}
                  sx={{
                    maxWidth: 800,
                    mx: 'auto',
                    px: screenSize.isMobile ? 2 : undefined,
                  }}
                >
                  <TextField
                    variant="standard"
                    name="name"
                    type="text"
                    label="Name"
                    sx={BLACK_TEXT_FIELD_STYLE}
                  />
                  <TextField
                    variant="standard"
                    name="email"
                    type="email"
                    label="Email"
                    sx={BLACK_TEXT_FIELD_STYLE}
                  />
                  <TextField
                    variant="outlined"
                    name="message"
                    label="Message"
                    multiline
                    minRows={3}
                    maxRows={10}
                    sx={BLACK_TEXT_FIELD_STYLE}
                    style={{
                      marginTop: 20,
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    onClick={(e) => sendEmail(e as any)}
                    sx={{
                      my: 2,
                      mx: 'auto',
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.text.secondary,
                      px: 8,
                      borderRadius: 8,
                    }}
                  >
                    Send
                  </Button>
                </Box>
                <Typography
                  textAlign="center"
                  fontSize={16}
                  sx={{
                    color: theme.palette.text.secondary,
                    mt: 2,
                  }}
                >
                  info@blindoff.com
                </Typography>
              </form>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
