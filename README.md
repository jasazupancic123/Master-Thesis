# FitCode

Project for managers, trainers and athletes to track their workouts more efficiently.

## TODO

- Update all `createMany` methods in training services to start order from the length of the array already stored in database

### Trainings

- Athlete training day view
- Athlete view calendar

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
- Disable updating root components' parents to not mess up trainings
- Adding internal components (no special case)
- Adding leaf components (move all exercises to the new leaf component)
- Deleting internal components (no special case)
- Deleting leaf components (move all exercises to the first parent)

### Cycles

- New cycle in the same group can only be created if it doesn't overlap with any other cycle
- Cycle events (event name, start date, end date, location, description)

### Users

- Trainer can add weight for all users or user can

### Future

- Write tests
- in subgroups, change field `membersIds` from string array to custom object array with member id and dates `entered` and `left`, because trainer can update subgroup in the middle of a cycle, or in the middle of the day and we want to keep user training data for statistics, and logic to `findAvailableMembers` changes by filtering not just subgroup `to` date field, but also all other subgroups' `left` property in `membersIds` to find potential removed athletes from subgroups, and when filtering all athlete trainings, also all subgroups have to be checked and their trainings to not miss any out
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
