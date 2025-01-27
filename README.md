# 🏋️‍♂️ FitCode

## 🚀 Project Overview

Trainers of different sports can create training programs for athletes, choose different exercises, even create their own, and adjust training difficulty with RMs, workload, intensity, recovery, and much more. Athletes confirm or update prescribed workload values accordingly and watch their progress through advanced visualization. 📊💪

---

## 📑 Table of Contents

- [🚀 Getting Started](#🚀-getting-started)
- [📂 Project Structure](#📂-project-structure)
- [🔧 Development Workflow](#️🔧-development-workflow)
- [🚀 Deployment](#🚀-deployment)
- [📞 Contact Information](#📞-contact-information)

---

## 🚀 Getting Started

Before developing the project locally, you must install the following programs:

- [☕ Java](https://www.java.com/download/ie_manual.jsp)
- [🟩 Node.js](https://nodejs.org/en)

Then, copy environment files for:

- **Backend**: Copy `.env.example` to `.env` and ask another developer for the correct credentials.
- **Frontend**: Copy `.env.example` to `.env.local` and ask another developer for the correct credentials.

Next, install all modules using `npm i` in all services and run them:

1. **🔥 Firebase Emulator**: The project uses Firebase services (Firestore, storage, functions, and authentication). To start the emulator, run:

   ```sh
   cd fitcode-backend-nest
   npm run firebase:dev
   ```

2. **⚙️ Backend API**: Start the NestJS API locally by running:

   ```sh
   cd fitcode-backend-nest
   npm run start:dev
   ```

On the first run, some data (e.g., athletes, groups, and cycles) will be inserted. Note that local Firebase Functions may not always work, and user roles might not be set properly. If you're working on non-athlete roles, update them manually by visiting [Firebase Auth Emulator](http://127.0.0.1:4000/auth).

3. **🖥️ Frontend Client**: Start the Next.js client locally by running:

   ```sh
   cd fitcode-frontend-next
   npm run dev
   ```

Then, visit http://localhost:3000.

## 📂 Project Structure

This is a mono-repo project with three main folders (and more to come if needed):

- **Backend**: RESTful API, written in [NestJS](https://nestjs.com/), a [Node.js](https://nodejs.org/en) framework built on [Express.js](https://expressjs.com/).

- **Frontend**: Client-side application, written in [Next.js](https://nextjs.org/), built on [React.js](https://react.dev/).

- **Docs**: Documentation library with all features (database, AI modules, etc.) explained in detail.

## 🔧 Development Workflow

We use **Git Flow**. The `**main**` branch is the primary branch, currently used for test deployment. Project management is done using [Jira](https://bedraczan.atlassian.net/jira/software/projects/FC/boards/1), where tasks are created, and each task has a unique ID (e.g., **FC-12**).

To start working on a task:

1. Pull the latest changes from the `**main**` branch.
2. Checkout to a new branch using the following naming convention:
   <your name>/<task type>/<task ID>/<description>

   **Task types** can be:

- `**feat**`: For developing new features or functionality.
- `**fix**`: For fixing bugs or issues in the codebase.
- `**refactor**`: For refactoring or improving existing code without changing functionality.
- `**docs**`: For documentation-related tasks and research.
- `**test**`: For writing or updating tests.
- `**chore**`: For maintenance tasks or small updates (e.g., dependency updates, configuration changes).

**Example branch**:

```
john/feat/FC-122/add-stripe-subscriptions
```

## 🚀 Deployment

- Backend: Deployed on [Fly.io](https://fly.io/apps/backend-nest-js).
- Frontend: Deployed on [Vercel](https://vercel.com/jeanbabtistas-projects/fitcode).

## 📞 Contact Information

- **Tomi Jagarinec** (Project Lead): tomiqatar@gmail.com
- **Žan Bedrač** (Backend Developer): bedrac.zan@gmail.com
- **Marko Plankelj** (Frontend Developer): mplankelj@gmail.com
- **Jaša Zupančič** (Frontend Developer): jasa.zupancic@student.um.si
