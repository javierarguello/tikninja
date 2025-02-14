import { initializeFirebaseAdmin } from '../libs/gcp/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { IVideoScript } from '../models';

// Define the video script interface
export type ICreatedVideoScript = Omit<
  IVideoScript,
  'scriptId' | 'createdAt' | 'updatedAt'
>;

export type IUpdateVideoScript = Omit<
  IVideoScript,
  'scriptId' | 'createdAt' | 'updatedAt'
>;

export class DatabaseService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    initializeFirebaseAdmin();
    this.db = getFirestore();
  }

  async updateVideoScript(scriptId: string, script: IUpdateVideoScript) {
    const docRef = this.db.collection('video-scripts').doc(scriptId);
    await docRef.update(script);
  }

  async getVideoScriptById(scriptId: string): Promise<IVideoScript | null> {
    const docRef = this.db.collection('video-scripts').doc(scriptId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }
    return { ...(doc.data() as IVideoScript), scriptId: doc.id };
  }

  async getVideoScriptStatus(scriptId: string): Promise<string> {
    const docRef = this.db.collection('video-scripts').doc(scriptId);
    const doc = await docRef.get();
    return doc.data()?.status || 'unknown';
  }

  async createVideoScript(script: ICreatedVideoScript): Promise<IVideoScript> {
    try {
      const now = new Date();
      const newScript = {
        ...script,
        createdAt: now,
        updatedAt: now,
      };
      const docRef = await this.db.collection('video-scripts').add(newScript);

      return {
        ...newScript,
        scriptId: docRef.id,
      };
    } catch (error) {
      console.error('Error creating video script:', error);
      throw error;
    }
  }
}
