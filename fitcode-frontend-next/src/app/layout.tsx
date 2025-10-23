import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { LOGO_YELLOW_IMG_URL } from '@/lib/common/const/image.const';
import { AuthProvider } from '@/store/auth.provider';
import { ScreenSizeProvider } from '@/store/screen-size.provider';
import ThemeRegistry from '@/store/theme.registry';

const onest = Onest({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blind/off',
  description: 'Do it right.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Blind/off',
    title: 'Blind/off',
    description: 'Do it right.',
    images: [
      {
        url: LOGO_YELLOW_IMG_URL,
        width: 3708,
        height: 549,
        alt: 'Blind/off preview',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: React.PropsWithChildren) {
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
