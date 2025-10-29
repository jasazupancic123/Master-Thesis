import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';

import { AppModule } from '@src/app.module';
import { TestAuth } from '@src/common/utils/test-auth.util';
import { FirebaseService } from '@src/firebase/firebase.service';

import { TestExpress } from './express.util';

export class TestApp {
  app: INestApplication;
  firebase: FirebaseService;
  module: TestingModule;
  http: TestExpress;
  auth: TestAuth;

  private constructor(
    app: INestApplication,
    firebase: FirebaseService,
    module: TestingModule,
  ) {
    this.app = app;
    this.firebase = firebase;
    this.module = module;
    this.auth = new TestAuth(firebase);
    this.http = new TestExpress(app, firebase);
  }

  /**
   * Bootstraps a NestJS app with cookie parser and returns a TestApp instance.
   */
  static async init(): Promise<TestApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const firebase = app.get(FirebaseService);
    return new TestApp(app, firebase, moduleFixture);
  }

  /**
   * Cleans up app resources after tests.
   */
  async close() {
    await this.app.close();
  }
}
