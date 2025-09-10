import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Container component="main" maxWidth="xs">
      {children}
    </Container>
  );
}
