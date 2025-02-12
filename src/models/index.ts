export interface IVideoScript {
  scriptId: string;
  userId?: string;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  segments?: IVideoScriptSegment[];
  producedVideoPath?: string;
  status?:
    | 'pending'
    | 'generated'
    | 'video-enriched'
    | 'audio-synthesized'
    | 'videos-downloaded';
}

export interface IVideoScriptSegment {
  index: number;
  subtitles: string;
  keywords: string[];
  videoUrl?: string;
  localVideoPath?: string;
  videoThumbnailUrl?: string;
  audioContent?: Buffer;
  csAudioUrl?: string;
  csVideoUrl?: string;
  assContent?: string;
}
