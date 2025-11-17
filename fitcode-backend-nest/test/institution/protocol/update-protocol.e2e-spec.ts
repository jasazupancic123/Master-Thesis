import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { TestDbService } from '@src/test-db/test-db.service';
import type {
  TrainingProtocol,
  UpdateTrainingProtocolDto,
} from '@src/training/entity/training-protocol.entity';
import { generateSuperset } from '@src/training/mock/training.stub';

describe('Update Training Protocol E2E', () => {
  let testApp: TestApp;
  let db: TestDbService;

  let institution: TestInstitution;
  let protocol: TrainingProtocol;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);

    institution = await db.institutions.createTest();
    protocol = await db.protocols.createTest(institution);
  });

  afterAll(async () => {
    await db.clear();
    await testApp.close();
  });

  async function req(
    token: string,
    institutionId: string,
    protocolId: string,
    body: UpdateTrainingProtocolDto,
  ) {
    return testApp.http.patch(
      `/training/institution/${institutionId}/protocol/${protocolId}`,
      token,
      body,
    );
  }

  it('should not update component', async () => {
    const res = await req(global.trainer.token, institution.id, protocol.id, {
      componentId: 'new-id',
    });

    expect(res.status).toBe(200);

    const updated = await db.protocols.findById({
      institutionId: institution.id,
      protocolId: protocol.id,
    });

    expect(updated.componentId).toBe(protocol.componentId);
  });

  it('should not update supersets if not provided', async () => {
    const res = await req(global.trainer.token, institution.id, protocol.id, {
      name: 'Updated Protocol Name',
    });

    expect(res.status).toBe(200);

    const updated = await db.protocols.findById({
      institutionId: institution.id,
      protocolId: protocol.id,
    });

    expect(updated.name).toBe('Updated Protocol Name');
    expect(updated.supersets).toEqual(protocol.supersets);
  });

  it('should update all properties except componentId', async () => {
    const newSupersets = [generateSuperset(), generateSuperset()];

    const res = await req(global.trainer.token, institution.id, protocol.id, {
      name: 'Updated Protocol Name',
      supersets: newSupersets,
    });

    expect(res.status).toBe(200);

    const updated = await db.protocols.findById({
      institutionId: institution.id,
      protocolId: protocol.id,
    });

    expect(updated.name).toBe('Updated Protocol Name');
    expect(updated.supersets).toEqual(newSupersets);
  });
});
