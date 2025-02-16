import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp();

    const db = getFirestore();
    db.settings({
      ignoreUndefinedProperties: true,
    });
    return db;
  }

  const db = getFirestore();
  return db;
}
