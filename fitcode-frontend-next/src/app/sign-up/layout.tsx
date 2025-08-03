import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import HeroNavbar from '@/components/hero-navbar/hero-navbar';

export default function Layout({ children }: ChildrenProps) {
  return (
    <>
      <HeroNavbar />

      <Container component="main" maxWidth="xs">
        {children}
      </Container>
    </>
  );
}
