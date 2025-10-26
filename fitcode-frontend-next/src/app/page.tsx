'use client';

import Box from '@mui/material/Box';
import React from 'react';

import { HERO_NAVBAR_HEIGHT } from '../lib/common/const/state';
import { theme } from '@/app/style';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import AboutUs from '@/components/landing-page/about-us';
import ContactUs from '@/components/landing-page/contact-us';
import Hero from '@/components/landing-page/hero';
import Technology from '@/components/landing-page/technology';
import { useActiveSection } from '@/hooks/use-active-section.hook';
import { LINKS_HERO_NAVBAR } from '@/lib/common/const/nav.const';

// Convert "64px" -> 64
const toPx = (v: string | number) =>
  typeof v === 'number' ? v : parseInt(String(v).replace('px', ''), 10);

const SECTION_IDS: string[] = Object.values(LINKS_HERO_NAVBAR).map(
  (link) => link.id
);
export type SectionId = (typeof SECTION_IDS)[number];

export type AppPageProps = React.PropsWithChildren & {
  title: string;
  description: string;
  id: string;
};

export default function Home() {
  const active = useActiveSection(SECTION_IDS, toPx(HERO_NAVBAR_HEIGHT));

  return (
    <>
      <HeroNavbar
        height={HERO_NAVBAR_HEIGHT}
        dissableLogo
        activeSection={active}
      />

      <Box
        width={'100%'}
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          backgroundColor: theme.palette.primary.main,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <Hero />
        <AboutUs />
        <Technology activeSection={active} />
        <ContactUs />
      </Box>
    </>
  );
}
