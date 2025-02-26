import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/auth-provider';
import ThemeRegistry from '@/context/theme-registry';
import { ScreenSizeProvider } from '@/context/screen-size-provider';
import { ChildrenProps } from '@/common/type/props.type';
import { TrainingProvider } from '@/context/training-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fitcode',
  description: 'Track workouts more efficiently.',
};

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <AuthProvider>
              <TrainingProvider>
                <ScreenSizeProvider>{children}</ScreenSizeProvider>
              </TrainingProvider>
            </AuthProvider>
            <Toaster />
          </ThemeRegistry>
        </AppRouterCacheProvider>
        <Toaster />
      </body>
    </html>
  );
}
