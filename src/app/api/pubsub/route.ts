import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Pub/Sub messages are sent as base64-encoded strings
    const body = await req.json();
    const message = body.message;

    // Decode the Pub/Sub message
    const data = message.data
      ? Buffer.from(message.data, 'base64').toString()
      : null;

    console.log('Received Pub/Sub message:', data);

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
