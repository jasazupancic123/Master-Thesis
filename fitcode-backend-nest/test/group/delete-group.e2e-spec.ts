import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { TestDbService } from '@src/test-db/test-db.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

describe('Delete Group (e2e)', () => {
  let app: INestApplication;
  let db: TestDbService;

  let institutionId: string;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    db = moduleFixture.get(TestDbService);
    institutionId = await db.institutions.save(generateInstitutionStub());
    groupId = await db.groups.save(generateGroupStub({ institutionId }));
  });

  afterAll(async () => {
    await db.cleanup();
    await app.close();
  });

  it.each([
    ['admin', global.admin.token],
    ['trainer', global.trainer.token],
    ['athlete', global.athlete.token],
  ])('should fail if user is %s', async (_, token) => {
    const response = await request(app.getHttpServer())
      .delete(`/group/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden resource');
  });

  it('should successfully delete group', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/group/${groupId}`)
      .set('Authorization', `Bearer ${global.manager.token}`);

    expect(response.status).toBe(200);

    const groups = await db.groups.findAll();
    expect(groups.length).toBe(0);

    groupId = await db.groups.save(generateGroupStub({ institutionId }));
  });

  it('should delete group and all trainings', async () => {
    const otherGroupId = await db.groups.save(
      generateGroupStub({ institutionId }),
    );

    // create 5 trainings for groupId and 5 for otherGroupId
    for (let i = 0; i < 10; i++)
      await db.trainings.save(
        generateTrainingStub({
          groupId: i < 5 ? groupId : otherGroupId,
          ownerId: global.trainer.uid,
          membersIds: [global.athlete.uid],
        }),
      );

    const trainings = await db.trainings.findAll();
    expect(trainings.length).toBe(10);

    const groupTrainingsBefore = trainings.filter(
      (training) => training.groupId === groupId,
    );
    expect(groupTrainingsBefore.length).toBe(5);

    const otherGroupTrainingsBefore = trainings.filter(
      (training) => training.groupId === otherGroupId,
    );
    expect(otherGroupTrainingsBefore.length).toBe(5);

    const response = await request(app.getHttpServer())
      .delete(`/group/${groupId}`)
      .set('Authorization', `Bearer ${global.manager.token}`);

    expect(response.status).toBe(200);

    const groups = await db.groups.findAll();
    expect(groups.length).toBe(1);

    const trainingsAfterDelete = await db.trainings.findAll();
    expect(trainingsAfterDelete.length).toBe(5);

    const groupTrainingsAfter = trainingsAfterDelete.filter(
      (training) => training.groupId === groupId,
    );
    expect(groupTrainingsAfter.length).toBe(0);

    const otherGroupTrainingsAfter = trainingsAfterDelete.filter(
      (training) => training.groupId === otherGroupId,
    );
    expect(otherGroupTrainingsAfter.length).toBe(5);

    groupId = await db.groups.save(generateGroupStub({ institutionId }));
    await db.groups.delete(otherGroupId);
  });
});
