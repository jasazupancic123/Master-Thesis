import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Get Institution Protocols E2E', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest();
    await db.protocols.createTest(institution, { name: 'p1' });
    await db.protocols.createTest(institution, { name: 'p2' });
    await db.protocols.createTest(institution, { name: 'p3' });
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, institutionId: string) {
    return testApp.http.get(`/institution/${institutionId}/protocol`, token);
  }

  it('should fail if user is not in institution', async () => {
    const newInstitution = await db.institutions.createTest({ random: true });
    const trainer = newInstitution.trainers[0];

    const res = await req(trainer.token, institution.id);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('You cannot view this institution');

    // cleanup
    await db.institutions.deleteTest(newInstitution.id);
  });

  it.each([
    ['trainer', global.trainer.token],
    ['manager', global.manager.token],
  ])(
    'should successfully return institution protocols for %s',
    async (_, token) => {
      const res = await req(token, institution.id);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'p1' }),
          expect.objectContaining({ name: 'p2' }),
          expect.objectContaining({ name: 'p3' }),
        ]),
      );
    },
  );
});
