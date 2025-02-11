import path from 'path';
import os from 'os';
import fs from 'fs';
import { IVideoScript, IVideoScriptSegment } from '../../models';
import { FFmpegProcessor } from './ffmpeg';
import { FileDownloader } from './fileDownloader';
import { GcpTextToSpeech } from './gcpTts';
import { OpenAIService } from './openai';
import { PexelsService } from './pexels';

export class VideoScriptService {
  async generateVideoScript(options: {
    title: string;
    description?: string;
  }): Promise<IVideoScript> {
    const openAIService = new OpenAIService();
    const videoScript = await openAIService.generateVideoScript(options);
    if (!videoScript) {
      throw new Error('No video script generated');
    }
    return videoScript;
  }

  async generateVideoScriptFullPipeline(options: {
    title: string;
    description?: string;
  }): Promise<IVideoScript> {
    let videoScript = await this.generateVideoScript(options);

    videoScript = await this._setupTmpDir(videoScript);

    const enrichedVideoScript = await this.enrichScriptWithVideos(videoScript);
    const downloadedVideoScript = await this.downloadAllSegmentVideos(
      enrichedVideoScript
    );
    const synthesizedVideoScript = await this.synthesizeAllSegmentAudios(
      downloadedVideoScript
    );
    const videoScriptWithAudio = await this.addAudioToAllSegmentVideos(
      synthesizedVideoScript
    );
    const mergedVideoScript = await this.mergeSegmentVideos(
      videoScriptWithAudio
    );
    return mergedVideoScript;
  }

  async synthesizeSegmentAudio(
    scriptId: string,
    segment: IVideoScriptSegment
  ): Promise<IVideoScriptSegment> {
    const gcpTts = new GcpTextToSpeech();
    const audioContent = await gcpTts.synthesizeSpeech(segment.subtitles);
    return {
      ...segment,
      audioContent: audioContent.audioContent,
      assContent: audioContent.assContent,
    };
  }

  async addAudioToVideoSegment(
    script: IVideoScript,
    segment: IVideoScriptSegment
  ): Promise<IVideoScriptSegment> {
    const ffmpegProcessor = new FFmpegProcessor();
    const localOutputVideoPath = segment.localVideoPath!.replace(
      '.mp4',
      '-with-audio.mp4'
    );
    await ffmpegProcessor.embedSubtitleTrack({
      jobId: script.scriptId,
      segmentIndex: segment.index,
      tmpPath: script.tmpPath!,
      inputVideoFilename: segment.localVideoPath!,
      assContent: segment.assContent!,
      outputVideoFilename: localOutputVideoPath!,
      audioContent: segment.audioContent!,
    });

    // await fs.promises.unlink(segment.localVideoPath!);
    return { ...segment, localVideoPath: localOutputVideoPath };
  }

  async downloadSegmentVideo(
    script: IVideoScript,
    segment: IVideoScriptSegment
  ): Promise<IVideoScriptSegment> {
    const fileDownloader = new FileDownloader();
    const tempFilePath = await fileDownloader.downloadToTemp(
      script.tmpPath!,
      segment.videoUrl!,
      `${segment.index}`
    );
    return {
      ...segment,
      localVideoPath: tempFilePath,
    };
  }

  async enrichSegmentWithVideo(
    segment: IVideoScriptSegment
  ): Promise<IVideoScriptSegment> {
    try {
      const pexelsService = new PexelsService();
      const searchQuery = segment.keywords.join(' OR ');
      const videoResult = await pexelsService.searchVideos({
        query: searchQuery,
        perPage: 2,
        page: 1,
        orientation: 'landscape',
      });

      if (!videoResult.videos || videoResult.videos.length === 0) {
        throw new Error(`No videos found for keywords: ${searchQuery}`);
      }

      const videosWithMinResolution = videoResult.videos.filter((v) =>
        v.video_files.some((f) => f.width >= 1920)
      );

      if (videosWithMinResolution.length === 0) {
        throw new Error(
          `No videos with minimum resolution found for keywords: ${searchQuery}`
        );
      }

      const randomIndex = 0; // Math.floor(Math.random() * videosWithMinResolution.length);
      const video = videosWithMinResolution[randomIndex];

      const videoFile = video.video_files
        .sort((a, b) => a.width - b.width)
        .filter((f) => f.width >= 1920)
        .at(0);

      if (!videoFile) {
        throw new Error(`No video file found for video: ${video.id}`);
      }

      return {
        ...segment,
        videoUrl: videoFile.link,
        videoThumbnailUrl: video.image,
      };
    } catch (error) {
      console.error('Failed to fetch video for segment:', error);
      throw error;
    }
  }

  async mergeSegmentVideos(script: IVideoScript): Promise<IVideoScript> {
    const ffmpegProcessor = new FFmpegProcessor();
    const localOutputVideoPath = path.join(
      script.tmpPath!,
      `${script.scriptId}-produced.mp4`
    );
    await ffmpegProcessor.mergeVideos({
      videoUrls: script.segments
        .sort((a, b) => a.index - b.index)
        .map((s) => s.localVideoPath!),
      outputFile: localOutputVideoPath,
      transitionEffect: 'fade',
      transitionDuration: 1,
    });
    // await Promise.all(
    //     script.segments.map(async (s) => {
    //         await fs.promises.unlink(s.localVideoPath!);
    //     }),
    // );
    return {
      ...script,
      producedVideoPath: localOutputVideoPath,
    };
  }

  async addAudioToAllSegmentVideos(
    script: IVideoScript
  ): Promise<IVideoScript> {
    const processedSegments: IVideoScriptSegment[] = [];
    for (const segment of script.segments) {
      console.log('adding audio to segment video', segment.localVideoPath);
      const enrichedSegment = await this.addAudioToVideoSegment(
        script,
        segment
      );
      processedSegments.push(enrichedSegment);
    }
    return {
      ...script,
      segments: processedSegments,
    };
  }

  async synthesizeAllSegmentAudios(
    script: IVideoScript
  ): Promise<IVideoScript> {
    const processedSegments: IVideoScriptSegment[] = [];
    for (const segment of script.segments) {
      console.log('synthesizing segment audio', segment.subtitles);
      const synthesizedSegment = await this.synthesizeSegmentAudio(
        script.scriptId,
        segment
      );
      processedSegments.push(synthesizedSegment);
    }
    return {
      ...script,
      segments: processedSegments,
    };
  }

  async downloadAllSegmentVideos(script: IVideoScript): Promise<IVideoScript> {
    const processedSegments: IVideoScriptSegment[] = [];
    for (const segment of script.segments) {
      console.log('downloading segment video', segment.videoUrl);
      const enrichedSegment = await this.downloadSegmentVideo(script, segment);
      processedSegments.push(enrichedSegment);
    }
    return {
      ...script,
      segments: processedSegments,
    };
  }

  async enrichScriptWithVideos(script: IVideoScript): Promise<IVideoScript> {
    const enrichedSegments: IVideoScriptSegment[] = [];
    for (const segment of script.segments) {
      console.log('enriching segment with video', segment.subtitles);
      const enrichedSegment = await this.enrichSegmentWithVideo(segment);
      enrichedSegments.push(enrichedSegment);
    }
    return {
      ...script,
      segments: enrichedSegments,
    };
  }

  private async _setupTmpDir(script: IVideoScript): Promise<IVideoScript> {
    const tmpDir = path.join(os.tmpdir(), script.scriptId);
    await fs.promises.mkdir(tmpDir, { recursive: true });
    return {
      ...script,
      tmpPath: tmpDir,
    };
  }
}
