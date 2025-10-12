import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import React from 'react';
import { Toaster } from 'react-hot-toast';

import type { ChildrenProps } from '@/common/type/props.type';
import { AuthProvider } from '@/store/auth.provider';
import { ScreenSizeProvider } from '@/store/screen-size.provider';
import ThemeRegistry from '@/store/theme.registry';

const onest = Onest({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blind/off',
  description: 'Do it right.',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Blind/off',
    title: 'Blind/off',
    description: 'Do it right.',
    images: [
      {
        url: '/url-logo.jpg',
        width: 3708,
        height: 549,
        alt: 'Blind/off preview',
      },
    ],
  },
};

export default async function RootLayout({ children }: ChildrenProps) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <body className={onest.className}>
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
