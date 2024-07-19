import React from 'react'
import HeroNavbar from '@/component/hero-navbar'
import Container from '@mui/material/Container'

export default function Layout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <HeroNavbar/>

            <Container component="main" maxWidth="xs">
                {children}
            </Container>
        </>
    )
}