import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { FirebaseService } from '../../src/firebase/firebase.service';
import { GroupService } from '../../src/group/group.service';
import { Group } from '../../src/group/entity/group.entity';
import { Institution } from '../../src/institution/entity/institution.entity';
import { InstitutionService } from '../../src/institution/service/institution.service';
import {
  createGroupWithCycles,
  createInstitution,
  createInstitutionWithUsers,
  deleteDoc,
  deleteInstitution,
} from '../common/utils/data.util';
import { createAthleteUserAndToken } from '../common/utils/auth.util';
import { TestUser } from '../common/type/auth.type';
import { BatchUpdateOneGroupDto } from '../../src/group/dto/update-group.dto';
import { generateGroupStub } from '../../src/group/mock/group.stub';
import { TestInstitution } from '../common/type/entity.type';

describe('Update Group (e2e)', () => {
  let app: INestApplication;
  let firebase: FirebaseService;
  let groupService: GroupService;
  let institutionService: InstitutionService;

  let newAthlete: TestUser;
  let institution: TestInstitution;
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

    newAthlete = await createAthleteUserAndToken(firebase);
    institution = await createInstitution(institutionService);
    group = await createGroupWithCycles(groupService, institution);
  });

  afterAll(async () => {
    await Promise.all([
      deleteDoc(firebase, 'INSTITUTION', institution.id),
      deleteDoc(firebase, 'GROUP', group.id),
    ]);

    await app.close();
  });

  describe('batchUpdate', () => {
    async function batchUpdateRequest(
      user: TestUser,
      input: BatchUpdateOneGroupDto[],
    ) {
      return await request(app.getHttpServer())
        .patch(`/group/update/batch`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ groups: input });
    }

    it('should fail if empty array is passed in', async () => {
      const response = await batchUpdateRequest(trainer, []);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Do not provide an empty array of groups',
      );
    });

    it('should fail if invalid groups are passed in', async () => {
      const response = await batchUpdateRequest(trainer, [
        group,
        generateGroupStub(),
      ]);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid groups provided');
    });

    it('should fail if not all groups have the same institution', async () => {
      const otherInstitution = await createInstitutionWithUsers(
        firebase,
        institutionService,
      );

      const otherGroup = await createGroupWithCycles(
        groupService,
        otherInstitution,
      );

      const response = await batchUpdateRequest(trainer, [group, otherGroup]);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You can only update groups from the same institution',
      );

      await Promise.all([
        deleteInstitution(firebase, otherInstitution),
        deleteDoc(firebase, 'GROUP', otherGroup.id),
      ]);
    });
  });
});
