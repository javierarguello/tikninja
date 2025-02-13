import { NextRequest, NextResponse } from 'next/server';
import { VideoScriptService } from '@/services/VideoScriptService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  if (!scriptId) {
    return NextResponse.json(
      { error: 'scriptId is required' },
      { status: 400 }
    );
  }
  const videoScriptService = new VideoScriptService();
  const status = await videoScriptService.getVideoScriptStatus(scriptId);
  return NextResponse.json({ scriptId, status });
}
