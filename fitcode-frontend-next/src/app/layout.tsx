import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { Toaster } from 'react-hot-toast';

import type { ChildrenProps } from '@/common/type/props.type';
import { AuthProvider } from '@/store/auth.provider';
import { ScreenSizeProvider } from '@/store/screen-size.provider';
import ThemeRegistry from '@/store/theme.registry';

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
