# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

### Research

- Database denormalization - for example, when a cycle is added to a group, should group have array property `cycleIds` and be updated each time when cycles are changed? Should this be applied to all tables (like user having his own `trainingIds`, `cycleIds`, ...)?
- Test logic for active cycle when user is part of multiple groups and has many cycles in each

### TODO

- Go through new update & remove methods for multiple entities (groups, cycles, subgroups, adding/removing members to groups/subgroups, trianing components, training supersets, training exercises) and complete them
- Change subgroups storage by adding `cycles` subcollections (same as in `groups`), so that querying for trainings will be easier

### Minor Fixes

- Athlete daily view
  - New style of components for athletes to allow him to update his own data
  - Athlete can update his own exercise info data
- Trainer daily view
  - Exercise card does not refresh properly when switching to another training with same component
  - When adding new superset, exercises cannot be added
  - Add design to see user wellness for the current date
  - Add ability to update athlete's bodyweight

### Components

- Component icons
- Disable updating root components' parents to not mess up trainings
- Adding internal components (no special case)
- Adding leaf components (move all exercises to the new leaf component)
- Deleting internal components (no special case)
- Deleting leaf components (move all exercises to the first parent)

### Future

- Athlete view calendar
- Add methodologies which user can copy as separate trainings
- Tags for methodologies by admin (upper body, lower body, strength, endurance, etc.)
- Managers that control trainers
- Copying & pasting trainings (and up the training workload by X percent)
- Athlete statistics and graphs
- Trainer statistics and graphs for athletes
- Subscriptions
- Write tests
- UPDATE DOCS!
- Add group address (gym location) for trainers so that groups with the same address get additional logic for overlapping cycles
- Automatically increasing training loads through periods by X percent
- New users can choose a sport and get a default training plan
- Limit trainer groups to 10 and upgrade for more
- Actions table to track all changes and undo last action?
