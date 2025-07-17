import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@src/app.module';
import { ComponentService } from '@src/component/component.service';
import type { Component } from '@src/component/entity/component.entity';
import { generateComponentStub } from '@src/component/mock/component.stub';
import { FirebaseService } from '@src/firebase/firebase.service';
import type { Group } from '@src/group/entity/group.entity';
import { GroupService } from '@src/group/group.service';
import { InstitutionService } from '@src/institution/service/institution.service';
import { generateTrainingStub } from '@src/training/mock/training.stub';

import type { TestInstitution } from '../common/type/entity.type';
import {
  createGroupWithCycles,
  createInstitution,
  deleteDoc,
} from '../common/utils/data.util';

describe('Get Trainings (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let componentService: ComponentService;
  let institutionService: InstitutionService;
  let groupService: GroupService;

  let institution: TestInstitution;
  let group: Group;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    componentService = moduleFixture.get(ComponentService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    component = await componentService.create(generateComponentStub());
    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'GROUP', group.id),
      deleteDoc(firebase, 'COMPONENT', component.id),
      deleteDoc(firebase, 'INSTITUTION', institution.id),
    ]);

    await app.close();
  });

  it('should successfully fetch all trainings by owner', async () => {
    const training = generateTrainingStub({ groupId: 'invalid-group-id' });

    const response = await request(app.getHttpServer())
      .post('/training')
      .set('Authorization', `Bearer ${global.trainer.token}`)
      .send(training);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`Group does not exist`);
  });
});
