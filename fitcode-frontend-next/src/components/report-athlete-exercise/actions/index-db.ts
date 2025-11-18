import { INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID } from '../const/index-db-id.const';
import type { IndexDbAthleteExerciseReport } from '../types/index-db-athlete-exercise-report';
import { lib } from '@/lib';

export async function updateReportInIndexDb(
  item: IndexDbAthleteExerciseReport
) {
  const items = await lib.common.indexedDb.items.get(
    INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID
  );

  if (!items) {
    await lib.common.indexedDb.items.put({
      id: INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID,
      payload: [item],
      updatedAt: new Date().getTime(),
    });

    return;
  }

  let savedReports = items.payload as IndexDbAthleteExerciseReport[];

  const existingItem = savedReports.find((r) => r.id === item.id);

  if (existingItem)
    savedReports = savedReports.map((r) => (r.id === item.id ? item : r));
  else savedReports.push(item);

  await lib.common.indexedDb.items.put({
    id: INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID,
    payload: savedReports,
    updatedAt: new Date().getTime(),
  });
}
export async function deleteReportFromIndexDb(id: string) {
  const items = await lib.common.indexedDb.items.get(
    INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID
  );

  if (!items) return;

  let savedReports = items.payload as IndexDbAthleteExerciseReport[];

  savedReports = savedReports.filter((r) => r.id !== id);

  await lib.common.indexedDb.items.put({
    id: INDEX_DB_ATHLETE_EXERCISE_REPORTS_ID,
    payload: savedReports,
    updatedAt: new Date().getTime(),
  });
}
