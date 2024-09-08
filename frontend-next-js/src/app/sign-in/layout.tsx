import React from 'react'
import HeroNavbar from '@/components/hero-navbar'
import Container from '@mui/material/Container'

export default function Layout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <HeroNavbar showLogin={false}/>

            <Container component="main" maxWidth="xs">
                {children}
            </Container>
        </>
    )
}