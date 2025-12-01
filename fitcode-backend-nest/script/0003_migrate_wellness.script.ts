import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type { Profile } from '@src/profile/entity/profile.entity';
import type { WellnessZScore } from '@src/profile/entity/wellnes-z-score.entity';
import type { Wellness } from '@src/profile/entity/wellness.entity';

import { runScript } from './config/script-runner';
import { setupFirebase } from './config/setup-firebase';

runScript('0003 Migrate Wellness', async () => {
  const { firebase } = setupFirebase();

  // for each profile, find the latest wellness and save it to the profile document
  const profiles = (
    await firebase.firestore.collection(FirestoreCollection.PROFILE).get()
  ).docs.map((doc) =>
    firebase.serialize(doc.data() as FirestoreEntity<Profile>),
  );

  for (const profile of profiles) {
    const wellnessCollection = firebase.firestore
      .collection(FirestoreCollection.PROFILE)
      .doc(profile.uid)
      .collection(FirestoreCollection.WELLNESS);

    const latestWellness = (
      await wellnessCollection.orderBy('date', 'desc').limit(1).get()
    ).docs.map((doc) =>
      firebase.serialize(doc.data() as FirestoreEntity<Wellness>),
    )[0];

    const wellness: WellnessZScore = latestWellness
      ? {
          ...latestWellness,
          zScoreFatigue: 0,
          zScoreSleep: 0,
          zScoreSoreness: 0,
        }
      : {
          date: new Date(),
          userId: profile.uid,
          fatigue: 0,
          sleep: 0,
          soreness: 0,
          zScoreFatigue: 0,
          zScoreSleep: 0,
          zScoreSoreness: 0,
          height: 0,
          weight: 0,
        };

    await firebase.firestore
      .collection(FirestoreCollection.PROFILE)
      .doc(profile.uid)
      .update({ wellness });
  }
})
  .then()
  .catch(console.error);
