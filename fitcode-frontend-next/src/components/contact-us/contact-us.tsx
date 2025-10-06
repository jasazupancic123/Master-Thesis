'use client';

import { HERO_NAVBAR_HEIGHT } from '@/app/state';
import { theme } from '@/app/style';
import { Box, Button, TextField, Typography } from '@mui/material';
import IndexPageTitleText from '../hero/index-page-title-text';
import { BLACK_TEXT_FIELD_STYLE } from '@/common/util/styles.util';
import { useScreenSize } from '@/store/screen-size.provider';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import Logo from '../logo/logo';
import Image from 'next/image';

export default function ContactUs() {
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

  return screenSize.isMobile ? (
    <Box
      id="contact-us"
      width="100%"
      height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      sx={{
        scrollMarginTop: HERO_NAVBAR_HEIGHT,
      }}
    >
      <Box
        width="100%"
        height="70%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        sx={{
          px: 4,
          backgroundColor: screenSize.isSmallerThanLaptop
            ? theme.palette.primary.main
            : undefined,
        }}
        gap={8}
      >
        <Logo width={200} version="dark" />
        <form
          ref={form}
          onSubmit={sendEmail}
          style={{
            width: '100%',
          }}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            gap={1}
            sx={{
              maxWidth: 800,
              mx: 'auto',
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
                my: 1,
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
              my: 1,
            }}
          >
            info@blindoff.com
          </Typography>
        </form>
      </Box>
      <Box
        width="100vw"
        height="40%"
        sx={{
          backgroundImage: 'url(/contact-us.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top',
          position: 'relative',
        }}
      />
    </Box>
  ) : (
    <Box
      id="contact-us"
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
        width="66%"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
        sx={{
          backgroundImage: 'url(/contact-us.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top',
          position: 'relative',
        }}
      >
        <IndexPageTitleText
          sx={{
            position: 'absolute',
            bottom: '5%',
            right: '2.5%',
            textAlign: 'right',
          }}
        >
          The hardest
          <br />
          mistakes to see
          <br />
          are your own
        </IndexPageTitleText>
      </Box>
      <Box
        width="34%"
        height={`calc(100vh - ${HERO_NAVBAR_HEIGHT})`}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={10}
          sx={{
            px: screenSize.isTablet ? 2 : 10,
            py: screenSize.isSmallerThanLaptop ? 10 : undefined,
            backgroundColor: screenSize.isSmallerThanLaptop
              ? theme.palette.primary.main
              : undefined,
          }}
        >
          <Logo width={200} version="dark" />
          <form ref={form} onSubmit={sendEmail} style={{ width: '100%' }}>
            <Box
              width="100%"
              display="flex"
              flexDirection="column"
              gap={1}
              sx={{
                maxWidth: 800,
                mx: 'auto',
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
  );
}
