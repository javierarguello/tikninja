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
  const script = await videoScriptService.getVideoScript(scriptId);
  const mappedScript = {
    title: script.title,
    description: script.description,
    status: script.status,
    segments: script.segments?.map((segment) => ({
      index: segment.index,
      subtitles: segment.subtitles,
      videoUrl: segment.videoUrl,
      videoThumbnailUrl: segment.videoThumbnailUrl,
    })),
  };
  return NextResponse.json({ script: mappedScript });
}
