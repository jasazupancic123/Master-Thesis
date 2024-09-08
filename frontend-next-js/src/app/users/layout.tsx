import Container from '@mui/material/Container'
import Sidebar from '@/components/sidebar'
import Box from '@mui/material/Box'
import React from 'react';

export default function Layout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <Container component="main" maxWidth="lg">
            <Sidebar title='USERS'/>

            <Box mt={20}>
                {children}
            </Box>
        </Container>
    )
}