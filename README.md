# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

## Firebase

```bash
firebase emulators:start
```

## TODO

### Trainings

- Copy trainings to subgroups on daily basis (add validUntil date to subgroups so that trainer can make new subgroups
  every day and when subgroups' date expires, trainer can again pick users from the subgroup to create other subgroups,
  do not query expired subgroups)
- Athlete training day view
- Athlete view calendar
- Athlete welness form
- Create training warmup and cooldown checkboxes to automatically create them

### Exercises

- Update exercise
- Delete exercise

### Groups

- Updating / adding / removing group members (removing a member should NOT remove his exercise info, it should just
  remove him from the group and keep the info for his personal statistics)

### Methodology

- Add methodologies which user can copy as separate trainings
- Tags for methodologies by admin (upper body, lower body, strength, endurance, etc.)

### Components

- Component icons
- Component nested dropdown menu (similar to exercise attributes)
- Disable updating root components' parents to not mess up trainings
- Adding internal components (no special case)
- Adding leaf components (move all exercises to the new leaf component)
- Deleting internal components (no special case)
- Deleting leaf components (move all exercises to the first parent)

### Cycles

- New cycle in the same group can only be created if it doesn't overlap with any other cycle
- Cycle events (event name, start date, end date, location, description)

### Users

- Add body weight and sport level when signing up
- Trainer can add weight for all users or user can

### Future

- UPDATE DOCS!
- Copying & pasting trainings
- Automatically increasing training loads through periods by X percent
- Athlete statistics and graphs
- Trainer statistics and graphs for athletes
- Managers that control trainers
- New users can choose a sport and get a default training plan
- Limit trainer groups to 10 and upgrade for more
