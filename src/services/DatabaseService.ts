import { initializeFirebaseAdmin } from '../libs/gcp/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { IVideoScript } from '../models';

// Define the video script interface
export type ICreatedVideoScript = Omit<
  IVideoScript,
  'scriptId' | 'createdAt' | 'updatedAt'
>;

export class DatabaseService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    initializeFirebaseAdmin();
    this.db = getFirestore();
  }

  /**
   * Creates a new video script in the database
   * @param script The video script data to create
   * @returns Promise with the created script ID
   */
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
