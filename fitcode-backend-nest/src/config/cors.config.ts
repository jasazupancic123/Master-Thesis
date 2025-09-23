import type { INestApplication } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

import { CommonService } from '@src/common/service/common.service';

import type { Environment } from './environment-validation-schema';

export function getCorsConfig(app: INestApplication): CorsOptions {
  const configService = app.get(ConfigService<Environment>);
  const commonService = app.get(CommonService);

  let origin: CorsOptions['origin'] = '*';
  if (commonService.env.isProduction()) {
    const whitelist =
      configService
        .get('FRONTEND_WHITELIST')
        ?.split(',')
        ?.map((url: string) => url.trim()) || [];

    if (whitelist.length > 0)
      origin = (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true); // allow REST tools or curl or SSR Next JS
        if (requestOrigin && whitelist.indexOf(requestOrigin) !== -1)
          callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      };
  }

  return {
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
