export interface IVideoScript {
  scriptId: string;
  userId?: string;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  segments: IVideoScriptSegment[];
  tmpPath?: string;
  producedVideoPath?: string;
}

export interface IVideoScriptSegment {
  index: number;
  subtitles: string;
  keywords: string[];
  videoUrl?: string;
  localVideoPath?: string;
  videoThumbnailUrl?: string;
  audioContent?: Buffer;
  assContent?: string;
}
