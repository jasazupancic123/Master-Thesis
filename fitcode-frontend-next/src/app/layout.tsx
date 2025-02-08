import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/auth-provider';
import { AppProvider } from '@/context/app-provider';
import { ScreenSizeProvider } from '@/context/screen-size-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fitcode',
  description: 'Track workouts more efficiently.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <AppProvider>
            <AuthProvider>
              <ScreenSizeProvider>{children}</ScreenSizeProvider>
            </AuthProvider>
          </AppProvider>
        </AppRouterCacheProvider>

        <Toaster />
      </body>
    </html>
  );
}
