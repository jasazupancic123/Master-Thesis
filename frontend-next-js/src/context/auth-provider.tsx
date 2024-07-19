'use client'
import {User} from 'firebase/auth'
import {createContext, useContext, useEffect, useState} from 'react'
import {CustomClaims} from '@/type/custom-claims.type'
import {FIREBASE_COOKIE_NAME} from '@/constant/cookies'
import {auth} from '@/config/firebase.config'
import { UserRole } from '@/enum/user-role.enum';
import { useLocalStorage } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { LINKS_AUTH } from '@/constant/link';
import { sleep } from '@/util/sleep';

export type AuthContextType = {
    loading: boolean;
    user: User;
    role: UserRole[];
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({children}: { children: any }) => {
    const router = useRouter()
    const [loading, setLoading] = useState<boolean>(true)
    const [user, setUser] = useState<User>(null)
    const [role, setRole] = useState<UserRole[]>([])
    const [_token, setToken]= useLocalStorage<string>(FIREBASE_COOKIE_NAME, null)

    useEffect(() => auth.onAuthStateChanged(async (user) => {
        if (user) {
            // user logged in
            const token = await user.getIdTokenResult()
            const claims = token.claims as CustomClaims

            setUser(user)
            setRole(claims.role || [])
            setToken(token.token)
        } else {
            // user logged out
            setUser(null)
            setRole([])
            setToken(null)
        }

        setLoading(false)
    }), [])

    async function logout(): Promise<void> {
        await auth.signOut()
        await sleep(0.25)
        router.push(LINKS_AUTH.login.href)
        setUser(null)
        setRole([])
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{loading, user, role, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType | null => useContext(AuthContext)
