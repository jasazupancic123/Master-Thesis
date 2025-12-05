import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Verify Magic Link (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.institutions.deleteTest(institution.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string) {
    return await testApp.http.post('/auth/link/verify', undefined, { token });
  }

  it('should fail to verify invalid token', async () => {
    const res = await req('invalid-token');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Link expired');
  });

  // NOTE - this test always fails, because issuing custom token on auth emulator
  // creates a payload with real Firebase project ID, not the emulator one, and it
  // cannot be verified against the emulator's auth backend.
  it('should verify valid token', async () => {
    /* const magicLinkRes = await testApp.http.post(
      `/auth/link`,
      global.trainer.token,
      { userId: global.athlete.uid },
    );

    expect(magicLinkRes.status).toBe(201);
    const { link } = magicLinkRes.body;

    const url = new URL(link);
    const token = url.searchParams.get('token');
    expect(token).toBeDefined();

    const verifyRes = await req(token!);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.uid).toBe(global.athlete.uid); */
  });
});
