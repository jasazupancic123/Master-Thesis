import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { SESSION_COOKIE_NAME } from '@src/common/constant/cookie.constant';
import type { FirebaseService } from '@src/firebase/firebase.service';

/**
 * Utility class to make HTTP requests against a NestJS test server
 * using a Firebase session cookie for authentication.
 */
export class TestExpress {
  constructor(
    private readonly app: INestApplication,
    private readonly firebase: FirebaseService,
  ) {}

  private async getSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    return await this.firebase.auth.createSessionCookie(idToken, { expiresIn });
  }

  async get(path: string, idToken: string) {
    const session = await this.getSessionCookie(idToken);
    return request(this.app.getHttpServer())
      .get(path)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${session}`]);
  }

  async post<T = undefined>(path: string, idToken: string, body?: T) {
    const session = await this.getSessionCookie(idToken);
    return request(this.app.getHttpServer())
      .post(path)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${session}`])
      .send(body || {});
  }

  async patch<T = undefined>(path: string, idToken: string, body?: T) {
    const session = await this.getSessionCookie(idToken);
    return request(this.app.getHttpServer())
      .patch(path)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${session}`])
      .send(body || {});
  }

  async delete<T = undefined>(path: string, idToken: string, body?: T) {
    const session = await this.getSessionCookie(idToken);
    return request(this.app.getHttpServer())
      .delete(path)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${session}`])
      .send(body || {});
  }
}
