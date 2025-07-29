import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/store/auth-provider';
import ThemeRegistry from '@/store/theme-registry';
import { ScreenSizeProvider } from '@/store/screen-size-provider';
import { ChildrenProps } from '@/common/type/props.type';

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
              <ScreenSizeProvider>{children}</ScreenSizeProvider>
            </AuthProvider>
            <Toaster position="bottom-center" />
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
