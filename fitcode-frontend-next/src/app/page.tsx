'use client';

import Box from '@mui/material/Box';
import React, { Fragment } from 'react';

import { HERO_NAVBAR_HEIGHT } from './state';
import { theme } from '@/app/style';
import { LINKS_HERO_NAVBAR } from '@/common/constant/navigation.constant';
import { useActiveSection } from '@/common/hooks/use-active-section.hook';
import type { ChildrenProps } from '@/common/type/props.type';
import AboutUs from '@/components/about-us/about-us';
import ContactUs from '@/components/contact-us/contact-us';
import Hero from '@/components/hero/hero';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import Technology from '@/components/technology/technology';

// Convert "64px" -> 64
const toPx = (v: string | number) =>
  typeof v === 'number' ? v : parseInt(String(v).replace('px', ''), 10);

const SECTION_IDS: string[] = Object.values(LINKS_HERO_NAVBAR).map(
  (link) => link.id
);
export type SectionId = (typeof SECTION_IDS)[number];

export type AppPageProps = ChildrenProps & {
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
