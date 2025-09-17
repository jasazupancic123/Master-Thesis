'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

import { FIREBASE_AUTH_ID_TOKEN } from '@/common/config/firebase.config';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { CommonService } from '@/common/service/common.service';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>

        <button
          onClick={() => {
            CommonService.instance.browser.removeClientCookie(
              FIREBASE_AUTH_ID_TOKEN
            );

            redirect(LINK_SIGN_IN.href);
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
