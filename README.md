# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

## Firebase

```bash
export GOOGLE_APPLICATION_CREDENTIALS=service-account.json && firebase emulators:start
```

## Main TODOs

- [x] User groups backend
  - add `group` collection to Firestore and store `groupIds` in user's custom claims
  - logic so only trainers can add athletes to their group, and managers can add trainers to their group, AND
    FIREBASE FUNCTION TO CREATE group for athlete when they sign up, so that each athlete has their own group so
    cycles can be added to their "mini" group
- [x] User groups frontend
  - add `group` page where manager will see all trainers and athletes in their group, and trainers will see all athletes in their group, and athletes will see their trainer
- [ ] Cycles backend - each group can have many cycles
  - add `cycle` collection to Firestore and store `cycleIds` to groups
- [ ] Training backend

## Nice to have

- [ ] Exercise pagination backend
- [ ] Exercise pagination frontend (9 cards max on a page and arrows to navigate)
