import { NextRequest, NextResponse } from 'next/server';
import { PubSubService } from '@/services/PubSubService';
import { VideoScriptService } from '@/services/VideoScriptService';

export async function POST(req: NextRequest) {
  try {
    // Pub/Sub messages are sent as base64-encoded strings
    const body = (await req.json()) as { message: { data: string } };
    const message = body.message;

    // Decode the Pub/Sub message
    const data = await PubSubService.deserializeMessage<{ scriptId: string }>(
      message
    );
    if (!data || !data.scriptId) {
      throw new Error('No data found in Pub/Sub message');
    }

    console.log('Processing video script:', data.scriptId);

    const videoScriptService = new VideoScriptService();
    await videoScriptService.processVideoScript(data.scriptId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Pub/Sub message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
