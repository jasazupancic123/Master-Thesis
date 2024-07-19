'use client'

import { AuthContextType, useAuth } from '@/context/auth-provider';
import Box from '@mui/material/Box'
import {notFound} from 'next/navigation'
import {UserRole} from '@/enum/user-role.enum'
import { ALL_ROLES } from '@/constant/user';

export default function withAuth(Component, roles: UserRole[] = ALL_ROLES) {
    return function AuthComponent(props) {
        const {loading, user, role} = useAuth() as AuthContextType

        if (loading) return <Box mt={10}><h2>Loading ...</h2></Box>
        if (!user || !roles.some(r => role?.includes(r))) return notFound()

        return <Component {...props}/>
    }
}