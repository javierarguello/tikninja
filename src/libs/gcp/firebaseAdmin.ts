import { getApps, initializeApp } from 'firebase-admin/app';

export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp();
  }
}
