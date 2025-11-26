import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import type { InitInstitution } from '@src/institution/entity/institution.entity';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Init Institution (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, institutionId: string) {
    return testApp.http.get(`/institution/${institutionId}`, token);
  }

  it('should init institution', async () => {
    const res = await req(global.manager.token, institution.id);
    expect(res.status).toBe(200);

    const body = res.body as InitInstitution;
    expect(body.id).toBe(institution.id);
  });
});
