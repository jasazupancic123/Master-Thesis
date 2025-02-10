import HeroNavbar from '@/components/hero-navbar';
import Container from '@mui/material/Container';
import { ChildrenProps } from '@/common/type/props.type';

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
