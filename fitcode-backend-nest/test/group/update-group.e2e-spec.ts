import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { FirestoreCollection } from '../../src/common/enum/firestore-collection.enum';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { generateRandomName } from '../utils/random.util';
import { Institution } from '../../src/institution/entity/institution.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { generateInstitutionStub } from '../../src/institution/mock/institution.mock';
import {
  createGroupWithCycles,
  createInstitution,
  deleteDoc,
} from '../utils/data.util';

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  let institution: Institution;
  let group: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebase = moduleFixture.get(FirebaseService);
    groupService = moduleFixture.get(GroupService);
    institutionService = moduleFixture.get(InstitutionService);

    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, {
      institutionId: institution.id,
    });
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteDoc(firebase, 'GROUP', group.id),
    ]);

    await app.close();
  });

  describe('batchUpdate', () => {
    it('should be defined', () => {
      expect(group).toBeDefined();
    });
  });
});
