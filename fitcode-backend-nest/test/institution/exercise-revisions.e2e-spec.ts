import { TestApp } from '@test/common/utils/app.util';

import type { TestInstitution } from '@src/common/type/entity.type';
import { generateExerciseStub } from '@src/exercise/mock/exercise.stub';
import { ExerciseService } from '@src/exercise/service/exercise.service';
import { TestDbService } from '@src/test-db/test-db.service';

describe('Institution Exercise Revisions (e2e)', () => {
  let testApp: TestApp;
  let db: TestDbService;
  let exerciseService: ExerciseService;

  let institution1: TestInstitution;
  let institution2: TestInstitution;

  beforeAll(async () => {
    testApp = await TestApp.init();
    db = testApp.module.get(TestDbService);
    exerciseService = testApp.module.get(ExerciseService);

    institution1 = await db.institutions.createTest();
    institution2 = await db.institutions.createTest({ random: true });
  });

  afterAll(async () => {
    await db.institutions.deleteTest(institution1.id);
    await db.institutions.deleteTest(institution2.id);
    await db.clear();
    await testApp.close();
  });

  it('should increment exercise revisions on global exercise create for all institutions', async () => {
    const initialRevisions = institution1.exerciseRevisions;
    expect(initialRevisions).toBe(0);

    await exerciseService.create(
      global.admin,
      generateExerciseStub({ name: 'Global1' }), // has id 'global1'
    );

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(1);
    expect(updatedInstitution2.exerciseRevisions).toBe(1);
  });

  it('should increment exercise revisions on global exercise update for all institutions', async () => {
    await exerciseService.update(
      global.admin,
      { exerciseId: 'global1' },
      generateExerciseStub(),
    );

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(2);
    expect(updatedInstitution2.exerciseRevisions).toBe(2);
  });

  it('should increment exercise revisions on global exercise delete for all institutions', async () => {
    await exerciseService.delete(global.admin, { exerciseId: 'global1' });

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(3);
    expect(updatedInstitution2.exerciseRevisions).toBe(3);
  });

  it('should increment exercise revisions on create institutional exercise for that institution only', async () => {
    await exerciseService.create(
      institution1.manager,
      generateExerciseStub({ name: 'Institutional1' }), // has id 'institutional1'
    );

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(4);
    expect(updatedInstitution2.exerciseRevisions).toBe(3);
  });

  it('should increment exercise revisions on update institutional exercise for that institution only', async () => {
    await exerciseService.update(
      institution1.manager,
      { exerciseId: `institutional1-${institution1.id.toLowerCase()}` },
      generateExerciseStub(),
    );

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(5);
    expect(updatedInstitution2.exerciseRevisions).toBe(3);
  });

  it('should increment exercise revisions on delete institutional exercise for that institution only', async () => {
    await exerciseService.delete(institution1.manager, {
      exerciseId: `institutional1-${institution1.id.toLowerCase()}`,
    });

    const updatedInstitution1 = await db.institutions.findById(institution1.id);
    const updatedInstitution2 = await db.institutions.findById(institution2.id);

    expect(updatedInstitution1.exerciseRevisions).toBe(6);
    expect(updatedInstitution2.exerciseRevisions).toBe(3);
  });
});
