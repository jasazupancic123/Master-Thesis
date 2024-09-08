'use client';

import { AuthContextType, useAuth } from '@/context/auth-provider';
import Box from '@mui/material/Box';
import { notFound } from 'next/navigation';
import { UserRole } from '@/user/enum/user-role.enum';
import { ALL_ROLES } from '@/common/constant/user.constant';
import { ElementType } from 'react';

export default function withAuth(Component: ElementType, roles: UserRole[] = ALL_ROLES) {
  return function AuthComponent(props: unknown) {
    const { loading, user, role } = useAuth() as AuthContextType;

    if (loading) return <Box mt={10}><h2>Loading ...</h2></Box>;
    if (!user || !roles.some(r => role?.includes(r))) return notFound();

    return <Component {...(props ?? {})} />;
  };
}