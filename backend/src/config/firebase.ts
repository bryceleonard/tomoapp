import * as admin from 'firebase-admin';

// Initialize Firebase Admin with service account credentials
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "tomo-461d4",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCe3miRWZjfRY6+\npUMV0aEQhll+aqzCFONAdPX5n0alk8RzYIus6GQXW98wWF/hxnZN1VdO5IyXMTED\nbdFkJUMZ1Ts4PyTLvXQhewOLHiIcvlluIr5S8M8hqMaTWxepcIFZNyu8CYD/d+2J\n8fQmp+nXFrWXGPMUCJm/GS1Henv+ix1x0Dwg+99GsxuCjWNczgUSgOC2PTc1/AJX\nxJcNabtf1nmjUPpMA2Lhb53Qe/5icAtGMbveVAkVkPU0dBGqt9J3c8B10XIVyp8n\nf13Dre4eZ8FHq/+t5HldS8ZtWIQUuDBErTghH7wPvo/FbciztFoyMGlWXtQKecBC\njI/uU13jAgMBAAECggEAMsRSuQPfIJX7L/vijKHg7MVp6sZO73Q6THozsjGOI1It\niEsVR0s51OcUUsAi36SKYIPosvrA3H2pMnXQ4EYyA5rKokY3TW38oshLERUvhGzl\nahbrJ9jw78odrrAAxzH++5HwRVXqJXje7OJnCUVGKegFXkPoRYIcE1+Jwxombmfo\nBU/W3qakeGFMqB/61mc3su7WuqHqF56N1vBY7puWI4KP4QMH1o0+W0hCeDPvRP0H\nCrX1gf0Ql/XcsZDMXQZtA5BrBzQSyYb0k83xw8VmrMmfP9eRxC/g9y78uwsp6nA1\n19Ql2jXbH0uWhiPaSctG9wwkqzjmM7gVg6GhtvufVQKBgQDVsE3HAyD8+4ARo4W4\nkE/is7nzE6H3hFF/gbrK3B+7GaMAELwbL/5EUnro4Cdu1tROIo99ZamqOEZz8bL4\nfbZaowL6n67w5DIC57fdL5zVnSL++RpBGhdjKHzgMG7c+pwCnqhKbb3OZXx8K3Bs\nw52yxsw/k95n1UprY0hQtxEInQKBgQC+U1StNNFK9HR3fxnR+Mw4NmtTfddWx0z3\nw6tkx0uFGsRWDIQ5bmJKmdokHbTvRaKF0qsfPvSTNQEnO3Z6Zq/fbYvZA6yBzC7t\nS/2imeIjWfV3ykiy7L80X8zm3Gl8M2fuyuFz0UYNwEboQKu6fpBbyTVvN8cBMqg6\nyJoDFCj4fwKBgDDXGf/JjEmmJhBiApc7jLaxA2g2bYeIG6R7/ziMdUgrROEn8gZ4\nwrHU9Dizuu+PdHjjV05+5Pd940Ru0swO15YBuhWUV8TBM1kMoy6PylXck3oZb1G/\n5+aHA3uuNjiVowDKSIaybHZ3JauvtgN19l49J8PERUoQKvE+gPHJ1b/VAoGAVAPx\nAyynnxDeQMnImhnb/Ix5QDfy0QnVfiHQDQK04aL5PIr162xA03GrC/pZHq58mdpv\nU7G0wS7KvYjQOiQOSvDOpROsGPgLVxEOe7K2UqipZSHUibdciEAp8Vcm8X63yH+i\nmj+tTvCr3GZ/6ClqjDn77oaOwIaeIKTg568Ejv0CgYEAv5kMJ5ZeC8lidYHg1OFd\nGj/3+WvcRMWGj0O/z0Ix7dxB9oQlJSxpa4Dbfvhusr+pA4bldhuabfhWmCqxmS58\nD7KEWeJsbgBVGvx0zHQyXYPlMmJkStB+MmPtGNIJtE3Eo2ijDc+1AmyDD6V73sMh\ncEy4lyPLX91Dv7bp9NFOd3k=\n-----END PRIVATE KEY-----\n",
    clientEmail: "firebase-adminsdk-fbsvc@tomo-461d4.iam.gserviceaccount.com"
  }),
  storageBucket: "tomo-461d4.firebasestorage.app"
});

// Initialize services
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

// Log the configuration (without sensitive values)
console.log('Firebase Admin Configuration:', {
  projectId: app.options.projectId,
  storageBucket: app.options.storageBucket,
}); 