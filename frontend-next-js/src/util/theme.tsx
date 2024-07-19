'use client'

import {createTheme} from '@mui/material'

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#0f9d58'
        },
        background: {
            default: '#121212',
            paper: '#242424'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        button: {textTransform: 'none'}
    }
})