# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

## Firebase

```bash
firebase emulators:start
```

## TODO

### Users

- Add body weight and sport level when signing up
- Trainer can add weight for all users or user can

### Components

- Component icons
- Disable updating root components' parents to not mess up trainings
- Adding internal components (no special case)
- Adding leaf components (move all exercises to the new leaf component)
- Deleting internal components (no special case)
- Deleting leaf components (move all exercises to the first parent)

### Groups

- Updating group members (removing a member should NOT remove his exercise info, it should just remove him from the
  group and keep the info for his personal statistics)
- Updating old super exercise info after a new member is added should check `createdAt` for user and super exercise
  info and not create new record if user was created after the super exercise info

### Exercises

- Architecture to add custom attributes and values to exercises (NOTE - since all attributes and their values can be
  deleted or updated at any time, use null checks everywhere)
- Exercise pagination backend
- Exercise pagination frontend (9 cards max on a page and arrows to navigate)
- Firebase storage to upload images and videos for exercises
- Filter user exercises correctly (maybe add group ids array to exercise which are allowed to see it?)
- Flags "warmup", "cooldown" and "test" for exercises

### Cycles

- New cycle can only be created if it doesn't overlap with any other cycle
- Cycle events (event name, start date, end date, location, description)

### Trainings

- Copy trainings to subgroups on daily basis
- Create training warmup and cooldown checkboxes to automatically create them
- Athlete training day view
- Athlete view calendar
- Athlete welness form

### Methodology

- Add methodologies which user can copy as separate trainings
- Tags for methodologies by admin (upper body, lower body, strength, endurance, etc.)

### Future

- UPDATE DOCS!
- Copying & pasting trainings
- Automatically increasing training loads through periods by X percent
- Athlete statistics and graphs
- Trainer statistics and graphs for athletes
- Managers that control trainers
- New users can choose a sport and get a default training plan
- Limit trainer groups to 10 and upgrade for more
