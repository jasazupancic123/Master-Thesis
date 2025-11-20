import type { INestApplication } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

import { CommonService } from '@src/common/service/common.service';

import type { Environment } from './environment-validation-schema';

export function getCorsConfig(app: INestApplication): CorsOptions {
  const configService = app.get(ConfigService<Environment>);
  const commonService = app.get(CommonService);

  const whitelist =
    configService
      .get('FRONTEND_WHITELIST')
      ?.split(',')
      ?.map((url: string) => url.trim()) || [];

  if (commonService.env.isDev())
    whitelist.push('http://localhost:3000', 'http://localhost:8080');

  return {
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true); // allow SSR or curl
      if (whitelist.includes(requestOrigin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
