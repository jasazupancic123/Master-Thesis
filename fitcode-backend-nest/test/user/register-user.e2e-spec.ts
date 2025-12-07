import { TestApp } from '@test/common/utils/app.util';

import type { CreateUserDto } from '@src/auth/dto/create-user.dto';
import { UserRole } from '@src/auth/enum/user-role.enum';
import { generateCreateUserStub } from '@src/auth/mock/auth.stub';
import type { TestInstitution } from '@src/common/type/entity.type';
import { FirebaseService } from '@src/firebase/firebase.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Register User (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let firebase: FirebaseService;

  let institution: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    firebase = testApp.module.get(FirebaseService);
    institution = await db.institutions.createTest();
  });

  afterAll(async () => {
    await db.institutions.deleteTest(institution.id);
    await db.clear();
    await testApp.close();
  });

  async function req(token: string, input: CreateUserDto) {
    return await testApp.http.post('/user/register', token, input);
  }

  describe('As Admin', () => {
    it.each([[UserRole.ADMIN], [UserRole.TRAINER], [UserRole.ATHLETE]])(
      'should not register %s',
      async (role) => {
        const res = await req(
          global.admin.token,
          generateCreateUserStub({ role }),
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Admin can only register managers');
      },
    );

    it('should successfully register manager', async () => {
      const input = generateCreateUserStub({ role: UserRole.MANAGER });
      const res = await req(global.admin.token, input);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        email: input.email,
        displayName: input.displayName,
        photoURL: input.photoURL,
        customClaims: { role: [UserRole.MANAGER] },
      });

      const dbUser = await firebase.auth.getUserByEmail(input.email);
      expect(dbUser).toBeDefined();
      expect(dbUser?.customClaims).toMatchObject({ role: [UserRole.MANAGER] });

      // delete user
      await testApp.auth.deleteUsers([dbUser!.uid]);
    });
  });

  describe('As Manager', () => {
    it.each([[UserRole.MANAGER], [UserRole.ADMIN]])(
      'should not register %s',
      async (role) => {
        const res = await req(
          global.manager.token,
          generateCreateUserStub({ role }),
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Manager can only register trainers and athletes',
        );
      },
    );

    it.each([[UserRole.TRAINER], [UserRole.ATHLETE]])(
      'should successfully register %s',
      async (role) => {
        const input = generateCreateUserStub({ role });
        const res = await req(global.manager.token, input);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
          email: input.email,
          displayName: input.displayName,
          photoURL: input.photoURL,
          customClaims: { role: [role] },
        });

        const dbUser = await firebase.auth.getUserByEmail(input.email);
        expect(dbUser).toBeDefined();
        expect(dbUser?.customClaims).toMatchObject({ role: [role] });

        // it should add them to institution
        const dbInstitution = await db.institutions.findById(institution.id);
        const memberIds = dbInstitution.members.map((m) => m.id);
        expect(memberIds).toContain(dbUser!.uid);

        // delete user
        await testApp.auth.deleteUsers([dbUser!.uid]);
        await db.institutions.institutionMembersRepository.removeMember(
          { institutionId: dbInstitution.id, uid: dbUser!.uid },
          role,
        );
      },
    );

    it.each([[UserRole.TRAINER], [UserRole.ATHLETE]])(
      'should add %s to institution even if auth user already exists',
      async (role) => {
        const existingUser = await testApp.auth.createUser(role);
        const input = generateCreateUserStub({
          role,
          email: existingUser.email,
        });

        // now, user should not be in institution
        const dbInstitutionBefore = await db.institutions.findById(
          institution.id,
        );

        const memberIds = dbInstitutionBefore.members.map((m) => m.id);
        expect(memberIds).not.toContain(existingUser.uid);

        const res = await req(global.manager.token, input);
        expect(res.status).toBe(201);

        // it should add them to institution
        const dbInstitutionAfter = await db.institutions.findById(
          institution.id,
        );

        const memberIdsAfter = dbInstitutionAfter.members.map((m) => m.id);
        expect(memberIdsAfter).toContain(existingUser.uid);

        // delete user
        await testApp.auth.deleteUsers([existingUser.uid]);
        await db.institutions.institutionMembersRepository.removeMember(
          { institutionId: dbInstitutionAfter.id, uid: existingUser.uid },
          role,
        );
      },
    );

    it('should throw error if user already belongs to some institution', async () => {
      const existingUser = await testApp.auth.createAthlete();

      // add to institution
      const otherInstitution = await db.institutions.createTest();
      await db.institutions.institutionMembersRepository.addMember(
        { role: UserRole.ATHLETE },
        { institutionId: otherInstitution.id, uid: existingUser.uid },
      );

      const input = generateCreateUserStub({
        role: UserRole.ATHLETE,
        email: existingUser.email,
      });

      const res = await req(global.manager.token, input);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already belongs to an institution');

      // cleanup
      await testApp.auth.deleteUsers([existingUser.uid]);
      await db.institutions.deleteTest(otherInstitution.id);
    });
  });
});
