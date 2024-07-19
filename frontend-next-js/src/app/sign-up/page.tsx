'use client'

import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {Grid, TextField} from '@mui/material'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {LINKS_AUTH} from '@/constant/link'
import toast from 'react-hot-toast'
import {sleep} from '@/util/sleep'
import {FirebaseAuthService} from '@/util/firebase'

export default function Page() {
    const router = useRouter()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            await FirebaseAuthService.register(email, password, `${firstName} ${lastName}`)
            toast.success('Account created successfully')

            await sleep(0.25)
            router.push(LINKS_AUTH.login.href)
        } catch (e) {
            toast.error(e.message)
        }
    }

    return (
        <>
            <Box display="flex" flexDirection="column" alignItems="center" mt={16}>
                <Avatar sx={{m: 1, bgcolor: 'primary.main'}}><LockOutlinedIcon/></Avatar>
                <Typography component="h1" variant="h5">{LINKS_AUTH.register.label}</Typography>

                <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 3}}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                autoComplete="given-name"
                                name="firstName"
                                required
                                fullWidth
                                id="firstName"
                                label="First Name"
                                autoFocus
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="lastName"
                                label="Last Name"
                                name="lastName"
                                autoComplete="family-name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2}}
                    >
                        {LINKS_AUTH.register.label}
                    </Button>

                    <Grid container justifyContent="flex-end">
                        <Grid item>
                            <Link href={LINKS_AUTH.login.href} style={{textDecoration: 'none', color: '#1976d2'}}>
                                Already have an account? Sign in
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    )
}