import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AttributeService } from '../../src/attribute/service/attribute.service';
import { ComponentService } from '../../src/component/component.service';
import { Component } from '../../src/component/entity/component.entity';
import { generateComponentStub } from '../../src/component/mock/component.stub';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { TrainingService } from '../../src/training/service/training.service';
import { ExerciseService } from '../../src/exercise/service/exercise.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { generateTrainingStub } from '../../src/training/mock/training.stub';
import { UserService } from '../../src/user/user.service';
import { InstitutionService } from '../../src/institution/service/institution.service';
import {
  createGroupWithCycles,
  createInstitution,
  deleteDoc,
} from '../common/utils/data.util';
import { Institution } from '../../src/institution/entity/institution.entity';

describe('Get Trainings (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let attributeService: AttributeService;
  let componentService: ComponentService;
  let exerciseService: ExerciseService;
  let trainingService: TrainingService;
  let institutionService: InstitutionService;
  let groupService: GroupService;
  let userService: UserService;

  let institution: Institution;
  let group: Group;
  let component: Component;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    attributeService = moduleFixture.get(AttributeService);
    componentService = moduleFixture.get(ComponentService);
    exerciseService = moduleFixture.get(ExerciseService);
    trainingService = moduleFixture.get(TrainingService);
    groupService = moduleFixture.get(GroupService);
    userService = moduleFixture.get(UserService);
    institutionService = moduleFixture.get(InstitutionService);

    institution = await createInstitution(institutionService);
    component = await componentService.create(generateComponentStub());
    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
    });
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
      .set('Authorization', `Bearer ${trainer.token}`)
      .send(training);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`Group does not exist`);
  });
});
