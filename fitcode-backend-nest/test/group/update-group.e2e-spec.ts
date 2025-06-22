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

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let firebaseService: FirebaseService;
  let groupService: GroupService;

  let institution: Institution;
  let group: Group;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseService = moduleFixture.get(FirebaseService);
    groupService = moduleFixture.get(GroupService);

    const institutionService = moduleFixture.get(InstitutionService);
    institution = await institutionService.create(
      global.admin,
      generateInstitutionStub(),
    );
  });

  beforeEach(async () => {
    group = await groupService.create(global.manager, {
      institutionId: institution.id,
      membersIds: [],
      name: generateRandomName(),
      ownerId: global.trainer.uid,
    });
  });

  afterAll(async () =>
    Promise.all([
      firebaseService.deleteCollection(FirestoreCollection.GROUP),
      firebaseService.deleteCollection(FirestoreCollection.INSTITUTION),
      app.close(),
    ]),
  );

  describe('batchUpdate', () => {
    it('should be defined', () => {
      expect(group).toBeDefined();
    });
  });
});
