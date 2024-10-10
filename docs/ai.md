# Valira AI

## Endpoints

| Endpoint                                                          | Description                                               | Method                              | Request                             | Response     |
| ----------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------- | ----------------------------------- | ------------ |
| Firebase Login                                                    | Login with Firebase SDK as trainer of the group           | POST                                | /                                   | /            |
| `/user/<userId>/face-recognition`                                 | POST                                                      | Update user's face recognition data | `InsertUserFaceRecognitionRequest`  | OK           |
| `/group`                                                          | Get all groups for the current user                       | GET                                 | `GetGroupRequest`                   | `Group[]`    |
| `/training?groupId=<groupId>&from=<start of day>&to=<end of day>` | Get all trainings for specified group for the current day | GET                                 | `GetTrainingsRequest`               | `Training[]` |
| `/training/<training-id>/data`                                    | Insert training data for a specific user                  | POST                                | `InsertTrainingExerciseUserRequest` | OK           |

## Firebase Login

```ts
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

const config = {
  apiKey: "string",
  authDomain: "string",
  projectId: "string",
  storageBucket: "string",
  messagingSenderId: "string",
  appId: "string"
  measurementId: "string"
}

const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app)

async function login(email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    if (e instanceof FirebaseError) {
      switch (e.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-email':
        case 'auth/weak-password':
          throw new Error('Email or password is incorrect');
        case 'auth/app-deleted':
        case 'auth/app-not-authorized':
        case 'auth/argument-error':
        case 'auth/invalid-api-key':
        case 'auth/operation-not-allowed':
          throw new Error('Internal error');
        default:
          throw new Error('An error occurred');
      }
    }
  }
}
```

> Note - for now, when the database is not deployed yet, I am using Firebase Emulator Suite to test the API locally. Also, Firebase config and email & password for the trainer will be provided to you, but for now, you don't need any credentials, just mock the responses of the API.

## Data Models

### Group

```json
{
  "id": "string",
  "ownerId": "string",
  "name": "string",
  "description": "string",
  "membersIds": ["string"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "deletedAt": "timestamp|null"
}
```

### Training

```json
{
  "id": "string",
  "groupId": "string",
  "ownerId": "string",
  "membersIds": ["string"],
  "subgroupId": "string|null",
  "copiedFrom": "string|null",
  "from": "timestamp",
  "to": "timestamp",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "deletedAt": "timestamp|null",
  "components": [
    {
      "componentId": "string",
      "order": "number",
      "color": "string",
      "supersets": [
        {
          "id": "string",
          "componentId": "string",
          "order": "number",
          "color": "string",
          "exercises": [
            {
              "exerciseId": "string",
              "exercise": {
                "userId": "string",
                "name": "string",
                "componentsIds": ["string"],
                "global": "boolean",
                "imageUrl": "string",
                "videoUrl": "string",
                "attributeValues": {}
              },
              "order": "number",
              "color": "string",
              "meta": {
                "sets": "number",
                "setType": "reps|distance|time|vo2",
                "setTypeValue": "number",
                "workloadType": "rm|bw|kg|int",
                "workloadTypeValue": "number",
                "tempo": "string",
                "effort": "easy|moderate|hard|max",
                "rec": "string"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

- `components.componentId` is component slug
- `components.supersets.exercises.exercise` is the exercise object (`attributes` field is irelevant for this use case)
- `components.supersets.exercises.meta` is the trainer's prescribed data for the exercise

## Requests & Responses

### InsertUserFaceRecognitionRequest

```json
{ "key": "value" }
```

> Note - my idea for the flow is the following: user registers, Firebase functions execute and create a user in Firestore database, then the user image is sent to your server, you process the data and send it back to this endpoint. Do you maybe have a better idea?

#### Example (mock data)

`POST /user/OgFP3BFY7m6gXn1GajBq/face-recognition`

````json
{
  "faceId": "string",
  "vector1": "string",
  "vector2": "string",
}

### GetGroupRequest

/

#### Example (mock data)

`GET /group`

```json
[
  {
    "id": "m53v7TmNoRNXMeuMXeSp",
    "ownerId": "jQLa8hDBXDh1ucJEFESX",
    "name": "Football team U19",
    "description": "Football team for players under 19 years old",
    "membersIds": ["OgFP3BFY7m6gXn1GajBq", "cQCvsmhaBYyvxwGiinPv"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  },
  {
    "id": "adb251RarOJ9MAkXeSp",
    "ownerId": "jQLa8hDBXDh1ucJEFESX",
    "name": "Football team U21",
    "description": "Older football team U21",
    "membersIds": ["cQCvsmhaBYyvxwGiinPv"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
]
````

### GetTrainingsRequest

```json
{
  "groupId": "string",
  "from": "timestamp",
  "to": "timestamp"
}
```

#### Example (mock data)

`GET /training?groupId=m53v7TmNoRNXMeuMXeSp&from=2024-01-01T00:00:00.000Z&to=2024-01-01T23:59:59.999Z`

```json
[
  {
    "id": "B9Saolajkknoa38a",
    "groupId": "m53v7TmNoRNXMeuMXeSp",
    "ownerId": "jQLa8hDBXDh1ucJEFESX",
    "membersIds": ["OgFP3BFY7m6gXn1GajBq", "cQCvsmhaBYyvxwGiinPv"],
    "subgroupId": null,
    "copiedFrom": null,
    "from": "2024-01-01T10:00:00.000Z",
    "to": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null,
    "components": [
      {
        "componentId": "strength",
        "order": 0,
        "color": "red",
        "supersets": [
          {
            "id": "7am3a8a3m8a3m8a3",
            "componentId": "string",
            "order": 0,
            "color": "red",
            "exercises": [
              {
                "exerciseId": "0amkn39j9SDFHJ9",
                "exercise": {
                  "userId": "jQLa8hDBXDh1ucJEFESX",
                  "name": "Squat Exercise",
                  "componentsIds": ["olympic"],
                  "global": false,
                  "imageUrl": null,
                  "videoUrl": null,
                  "attributeValues": {}
                },
                "order": 0,
                "color": "red",
                "meta": {
                  "sets": 3,
                  "setType": "reps",
                  "setTypeValue": 12,
                  "workloadType": "kg",
                  "workloadTypeValue": 100,
                  "tempo": "2-0-2",
                  "effort": "hard",
                  "rec": "60s"
                }
              }
            ]
          }
        ]
      }
    ]
  }
]
```

### InsertTrainingExerciseUserRequest

```json
{
  "userId": "string",
  "componentId": "string",
  "supersetId": "string",
  "exerciseId": "string",
  "data": {
    "set": "number",
    "workloadValue": "number",
    "tempo": "string|null",
    "effort": "easy|moderate|hard|max|null",
    "rec": "string|null"
    // more to come
  }
}
```

> Note - `componentId`, `supersetId` and `exerciseId` are available from the training object

- `data.set` is the current set number
- `data.workloadValue` is the weight lifted, distance covered, time spent or VO2 max reached (depending on the exercise)
- `data.tempo` is the tempo of the exercise (e.g. 2-0-2)
- `data.effort` is the effort of the exercise (easy, moderate, hard, max)
- `data.rec` is the recovery time after the exercise (e.g. 60s)

#### Example (mock data)

Every time you detect that John performs a squat with 100 kg with tempo 2-0-2 and hard effort, send the following request:

`POST /training/<training-id>/data`

```json
{
  "userId": "OgFP3BFY7m6gXn1GajBq",
  "componentId": "strength",
  "supersetId": "7am3a8a3m8a3m8a3",
  "exerciseId": "0amkn39j9SDFHJ9",
  "data": {
    "set": 1,
    "workloadValue": 100,
    "tempo": "2-0-2",
    "effort": "hard"
  }
}
```

In the database, trainer's prescribed training data is also stored, like `sets` (how many sets should the user do) and `setTypeValue` (how many reps/distance/... the user should perform). If `sets` is 3 and `setTypeValue` is 12, that means that John should perform 3x12 reps.
