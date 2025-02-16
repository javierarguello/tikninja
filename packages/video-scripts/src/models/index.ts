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
    | 'videos-downloaded'
    | 'audio-merged-into-videos';
}

export interface IVideoScriptSegment {
  index: number;
  subtitles: string;
  keywords: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  csAudioUrl?: string;
  csVideoUrl?: string;
  assContent?: string;

  // private fields not returned in the response and not saved in the database
  _localVideoPath?: string;
  _localAudioPath?: string;
  _audioContent?: Buffer;
}
