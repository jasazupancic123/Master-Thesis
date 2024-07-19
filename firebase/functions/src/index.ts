import {auth, config} from 'firebase-functions'
import {getAuth} from 'firebase-admin/auth'
import * as admin from 'firebase-admin'

admin.initializeApp(config().firebase)

/* Create custom user claims per registration */
export const createUserRole = auth.user().onCreate(async (user) => {
    // create new group
    await admin.firestore().collection('group').add({
        name: 'My Group',
        createdAt: new Date(),
        userId: user.uid,
        memberIds: [user.uid],
        cycleIds: [],
    })

    await getAuth().setCustomUserClaims(user.uid, {
        role: ['athlete'],
        level: 'beginner',
    })
})