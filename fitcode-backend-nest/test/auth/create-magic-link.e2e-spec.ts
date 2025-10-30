import { TestApp } from '@test/common/utils/app.util';

import type { CreateMagicLinkDto } from '@src/auth/dto/create-magic-link.dto';
import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Create Magic Link (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.institutions.remove(institution.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, input: CreateMagicLinkDto) {
    return await testApp.http.post('/auth/link', token, input);
  }

  it('should not create magic link if provided user does not exist', async () => {
    const res = await req(global.manager.token, {
      userId: 'non-existing-uid',
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should not create magic link if provided user is not from the same institution', async () => {
    const otherInstitution = await db.institutions.createTest({
      createRandomAthlete: true,
      createRandomManager: true,
      createRandomTrainer: true,
    });

    const res = await req(global.manager.token, {
      userId: otherInstitution.athletes[0].uid,
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Cannot create link for this user');

    await db.institutions.remove(otherInstitution.id);
  });

  it.each([
    ['manager', global.manager.token],
    ['trainer', global.trainer.token],
  ])('should allow %s to create magic link', async (_, token) => {
    const res = await req(token, { userId: global.athlete.uid });
    expect(res.status).toBe(201);
    expect(res.body.link).toBeDefined();
    expect(res.body.link).toContain('/auth/magic?token=');
  });
});
