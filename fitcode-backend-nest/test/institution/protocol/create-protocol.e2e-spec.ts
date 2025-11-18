import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';
import { MAX_NUM_SUPERSETS } from '@src/training/constant/training-limits.constant';
import type { CreateTrainingProtocolDto } from '@src/training/entity/training-protocol.entity';
import { generateSuperset } from '@src/training/mock/training.stub';

describe('Create Training Protocol E2E', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution1: TestInstitution;
  let institution2: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution1 = await db.institutions.createTest();
    institution2 = await db.institutions.createTest({ random: true });
  });

  afterAll(async () => {
    await db.institutions.remove(institution1.id);
    await db.institutions.remove(institution2.id);
    await db.clear();
    await testApp.close();
  });

  async function req(
    token: string,
    institutionId: string,
    body: CreateTrainingProtocolDto,
  ) {
    return testApp.http.post(
      `/training/institution/${institutionId}/protocol`,
      token,
      body,
    );
  }

  it('should fail if user is not allowed to edit institution protocols', async () => {
    const res = await req(institution2.trainers[0].token, institution1.id, {
      name: 'Protocol 1',
      componentId: 'c1',
      supersets: [],
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      'You do not have permission to edit training protocols',
    );
  });

  it('should fail if component does not exist', async () => {
    const res = await req(institution1.trainers[0].token, institution1.id, {
      name: 'Protocol 1',
      componentId: 'non-existing',
      supersets: [],
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Component not found');
  });

  it('should fail if supersets are not valid', async () => {
    const res = await req(institution1.trainers[0].token, institution1.id, {
      name: 'Protocol 2',
      componentId: 'other',
      supersets: Array.from({ length: MAX_NUM_SUPERSETS + 1 }).map(() =>
        generateSuperset(),
      ),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain(
      `You can only have up to ${MAX_NUM_SUPERSETS} supersets per component`,
    );
  });

  it('should successfully create protocol', async () => {
    const res = await req(institution1.trainers[0].token, institution1.id, {
      name: 'Protocol 3',
      componentId: 'other',
      supersets: [generateSuperset(), generateSuperset()],
    });

    expect(res.status).toBe(201);

    const dbProtocols = await db.protocols.getAllByInstitution({
      institutionId: institution1.id,
    });

    expect(dbProtocols).toHaveLength(1);

    const protocol = dbProtocols[0];
    expect(protocol.id).toBeDefined();
    expect(protocol.institutionId).toBe(institution1.id);
    expect(protocol.name).toBe('Protocol 3');
    expect(protocol.componentId).toBe('other');
    expect(protocol.supersets).toHaveLength(2);

    // delete protocol
    await db.protocols.delete({
      institutionId: institution1.id,
      protocolId: protocol.id,
    });
  });
});
