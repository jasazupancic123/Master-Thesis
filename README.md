# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

### Research

- Database denormalization - for example, when a cycle is added to a group, should group have array property `cycleIds` and be updated each time when cycles are changed? Should this be applied to all tables (like user having his own `trainingIds`, `cycleIds`, ...)?
- Test logic when user is part of multiple groups and has many cycles in each

### Minor Fixes

- Athlete logic
  - Add `trainingIds` field for easier query
- Athlete daily view
  - New style of components for athletes to allow him to update his own data
  - Athlete can update his own exercise info data
- Trainer daily view
  - Exercise card does not refresh properly when switching to another training with same component
  - When adding new superset, exercises cannot be added
  - Add design to see user wellness for the current date
  - Add ability to update athlete's bodyweight

### Trainings

- Athlete view calendar

### Exercises

- Update exercise
- Delete exercise (soft delete)

### Groups

- Updating / adding / removing group members (change `membersIds` field from type `string[]` to type `{ memberId: string, createdAt: Date (for adding), deletedAt (for removing) }[]`) and same member can occur multiple times in the group, in case he was added / removed multiple times. To fetch all his trainings, we need to filter cycles between these dates
- Do the same for subgroups as above and change `findAvailableMembers` logic

### Methodology

- Add methodologies which user can copy as separate trainings
- Tags for methodologies by admin (upper body, lower body, strength, endurance, etc.)

### Components

- Component icons
- Disable updating root components' parents to not mess up trainings
- Adding internal components (no special case)
- Adding leaf components (move all exercises to the new leaf component)
- Deleting internal components (no special case)
- Deleting leaf components (move all exercises to the first parent)

### Cycles

- Cycle events (event name, start date, end date, location, description)

### Future

- Subscriptions
- Write tests
- UPDATE DOCS!
- Add group address (gym location) for trainers so that groups with the same address get additional logic for
  overlapping cycles
- Create training warmup and cooldown checkboxes to automatically create them
- Actions table to track all changes and undo last action?
- Copying & pasting trainings
- Automatically increasing training loads through periods by X percent
- Athlete statistics and graphs
- Trainer statistics and graphs for athletes
- Managers that control trainers
- New users can choose a sport and get a default training plan
- Limit trainer groups to 10 and upgrade for more
