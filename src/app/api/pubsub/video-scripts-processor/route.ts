import { NextRequest, NextResponse } from 'next/server';
import { PubSubService } from '@/services/PubSubService';

export async function POST(req: NextRequest) {
  try {
    // Pub/Sub messages are sent as base64-encoded strings
    const body = (await req.json()) as { message: { data: string } };
    const message = body.message;

    // Decode the Pub/Sub message
    const data = await PubSubService.deserializeMessage<{ scriptId: string }>(
      message
    );
    console.log('Received Pub/Sub message:', body.message, data);

    // Add your message processing logic here

    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Pub/Sub message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
