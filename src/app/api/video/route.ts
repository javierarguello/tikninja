import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/libs/gcp/firebaseAdmin';
import { PubSub } from '@google-cloud/pubsub';

export async function POST(request: Request) {
  try {
    console.log('Creating video script...', process.env.VIDEO_PROCESSING_TOPIC);
    // Initialize Firebase Admin if not already initialized
    initializeFirebaseAdmin();
    const db = getFirestore();

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const userId = '123';
    const newScript = {
      title,
      description: description || null,
      createdAt: now,
      updatedAt: now,
      userId,
      status: 'pending',
    };
    const docRef = await db.collection('video-scripts').add(newScript);

    const pubsub = new PubSub();
    const topicName = process.env.VIDEO_PROCESSING_TOPIC!;

    const messageData = {
      scriptId: docRef.id,
    };

    await pubsub
      .topic(topicName)
      .publishMessage({
        data: Buffer.from(JSON.stringify(messageData)),
      });

    return NextResponse.json({
      ...newScript,
      scriptId: docRef.id,
    });
  } catch (error) {
    console.error('Error creating video script:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
