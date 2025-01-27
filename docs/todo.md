# 🚀 Project TODO List

**Description**:  
This document tracks all features to be implemented and bugs to be fixed in the project.

---

## 📑 List

| Type | Title                                                                                                         | Status      |
| ---- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| Docs | [Database Queries](#database-queries)                                                                         | Not Started |
| Fix  | [Stale Trainings (Trainer View)](#stale-trainings-trainer-view)                                               | Not Started |
| Fix  | [Exercise Image And Video](#exercise-image-and-video)                                                         | Not Started |
| Fix  | [Join Custom And Global Exercises](#join-custom-and-global-exercises)                                         | Not Started |
| Feat | [Filter Exercises By Custom Attributes](#filter-exercises-by-custom-attributes)                               | Not Started |
| Feat | [Methodologies](#methodologies)                                                                               | Not Started |
| Feat | [Athlete Calendar](#athlete-calendar)                                                                         | Not Started |
| Feat | [Athlete Progress Visualization](#athlete-progress-visualization)                                             | Not Started |
| Feat | [Increasing Training Loads](#increasing-training-loads)                                                       | Not Started |
| Feat | [Delete Group](#delete-group)                                                                                 | Not Started |
| Feat | [Admin View](#admin-view)                                                                                     | Not Started |
| Feat | [Methodology Tags](#methodology-tags)                                                                         | Not Started |
| Feat | [Generated Training Plan Based On Sport And Fit Level](#generated-training-plan-based-on-sport-and-fit-level) | Not Started |
| Feat | [Components CRUD](#components-crud)                                                                           | Not Started |
| Feat | [Production Branch](#production-branch)                                                                       | Not Started |
| Feat | [Subscriptions](#subscriptions)                                                                               | Not Started |
| Feat | [Undo Button](#undo-button)                                                                                   | Not Started |
| Feat | [Manager Role](#manager-role)                                                                                 | Not Started |
| Test | [Testing](#testing)                                                                                           | Not Started |
| Feat | [Fitness Role](#fitness-role)                                                                                 | Not Started |

---

## 📝 Docs

**Description**: Write all possible cases of queries for each user role into a document.

---

## 🛠️ Features

### Filter Exercises By Custom Attributes

**Description**: Filter exercises by custom attributes, provided by admin.

### Methodologies

**Description**: Add methodologies which user can copy as separate trainings.

### Athlete Calendar

**Description**: Athlete view calendar.

### Athlete Progress Visualization

**Description**: Athlete stats for exercise load, weight, soreness, ..., and also trainer stats to see all athletes stats in the group.

**Tasks**:

- [ ] Athlete statistics and graphs
- [ ] Trainer statistics and graphs for athletes

### Increasing Training Loads

**Description**: Add ability to copy one training or one week of trainings and increase their workload values by some percentage amount.

### Delete Group

**Description**: Delete group, delete all its cycles?, trainings?, user data?, or don't allow to delete the group?

### Admin View

**Description**: Admin view to view all users, set user roles, see and update sport components, add exercise attributes.

**Tasks**:

- [ ] Users table
- [ ] Sport components table
- [ ] Exercise attributes table

### Methodology Tags

**Description**: Tags for methodologies by admin (upper body, lower body, strength, endurance, etc.).

### Generated Training Plan Based On Sport And Fit Level

**Description**: New users can choose a sport and get a default training plan.

### Components CRUD

**Description**: Advanced operations for components, such as deleting a component, updating its parents, ...

**Tasks**:

- [ ] Component icons
- [ ] Disable updating root components' parents to not mess up trainings
- [ ] Adding internal components (no special case)
- [ ] Adding leaf components (move all exercises to the new leaf component)
- [ ] Deleting internal components (no special case)
- [ ] Deleting leaf components (move all exercises to the first parent)

### Production Branch

**Description**: Create a production branch to deploy the app.

**Tasks**:

- [ ] Create `prod` branch based from `main`
- [ ] Add protective branch rules on GitHub

### Subscriptions

**Description**: Add Stripe subscriptions and plans.

### Undo Button

**Description**: Actions table to track all changes and undo last action.

### Manager Role

**Description**: Manager role.

### Fitness Role

**Description**: Fitness role for the facility. Each fitness has multiple stations / machines, and in the same fitness, multiple trainers can have sessions simultaneously, if there is no overlap on stations. Implement logic to "book" machines in fitness per training session.

---

## 🐛 Bugs

### Stale Trainings (Trainer View)

**Description**: Trainings' state is not correctly updated when switching between daily, weekly, cycle and yearly view.

**Tasks**:

- [ ] Correctly update state
- [ ] Check if there are too many queries and if they can be combined in backend (for example, now we manually fetch cycle and then manually fetch all its trainings, maybe it would be more efficient to return it all from backend in one query)

### Exercise Image And Video

**Description**: Upload exercise image or video and keep video background playing for exercise card.

### Join Custom And Global Exercises

**Description**: Join custom and global exercises in backend in plain JS, since there is no `OR` query in Firestore.

---

## ⚠️ Test

### Testing

**Description**: Write unit and E2E tests on backend and frontend.
