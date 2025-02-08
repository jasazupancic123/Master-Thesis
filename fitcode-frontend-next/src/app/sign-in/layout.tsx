import React, { ReactNode } from 'react';
import HeroNavbar from '@/components/hero-navbar';
import Container from '@mui/material/Container';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <>
      <HeroNavbar showLogin={false} />

      <Container component="main" maxWidth="xs">
        {children}
      </Container>
    </>
  );
}
