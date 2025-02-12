import { NextResponse } from 'next/server';
import { VideoScriptService } from '@/services/VideoScriptService';
import { z } from 'zod';
import { getAndValidateRequestBody } from '@/libs/api';

// Define the schema
const createVideoScriptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const {
      data: { title, description },
      errorResponse,
    } = await getAndValidateRequestBody(request, createVideoScriptSchema);

    if (errorResponse) {
      return errorResponse;
    }

    const userId = '123';
    const videoScriptService = new VideoScriptService();
    const videoScript = await videoScriptService.createVideoScript({
      title,
      description: description || undefined,
      userId,
      status: 'pending',
    });

    return NextResponse.json({ videoScript });
  } catch (error) {
    console.error('Error creating video script:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
