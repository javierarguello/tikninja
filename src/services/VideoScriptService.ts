import { IVideoScript } from '@/models';
import { ICreatedVideoScript } from './DatabaseService';
import { DatabaseService } from './DatabaseService';
import { PubSubService } from './PubSubService';
import { VideoScriptGeneratorService } from '../libs/video/VideoScriptGeneratorService';
import { CloudStorage } from '../libs/gcp/cloudStorage';
import * as fs from 'fs';
export class VideoScriptService {
  constructor(
    private readonly db: DatabaseService = new DatabaseService(),
    private readonly pubSubService: PubSubService = new PubSubService()
  ) {}

  async createVideoScript(script: ICreatedVideoScript): Promise<IVideoScript> {
    const videoScript = await this.db.createVideoScript(script);
    await this.pubSubService.publishVideoScriptToPubSub(videoScript);

    return videoScript;
  }

  async processVideoScript(scriptId: string): Promise<void> {
    const script = await this.db.getVideoScriptById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    if (script.status === 'pending') {
      await this.generateScript(script);
    } else if (script.status === 'generated') {
      await this.enrichScriptWithVideos(script);
    } else if (script.status === 'video-enriched') {
      await this.synthesizeAudioForAllSegments(script);
    } else if (script.status === 'audio-synthesized') {
      await this.downloadAllSegmentVideos(script);
    }
  }

  async downloadAllSegmentVideos(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const tmpPath = await videoScriptGeneratorService.setupTmpDir(script);
    try {
      const downloadedScript =
        await videoScriptGeneratorService.downloadAllSegmentVideos(
          tmpPath,
          script
        );

      for (const segment of downloadedScript.segments!) {
        const cloudStorage = new CloudStorage();
        const { fileName } = await cloudStorage.uploadFile(
          process.env.CS_BUCKET_NAME!,
          segment.localVideoPath!,
          `${script.scriptId}/${segment.index}.mp4`
        );

        segment.csVideoUrl = fileName;
        segment.localVideoPath = undefined;
      }

      await this._updateVideoScriptAndNotify({
        ...script,
        segments: downloadedScript.segments,
        status: 'videos-downloaded',
      });
    } finally {
      try {
        await fs.promises.rmdir(tmpPath, { recursive: true });
      } catch (error) {
        console.error('Error deleting tmp directory:', error);
      }
    }
  }

  async synthesizeAudioForAllSegments(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const synthesizedScript =
      await videoScriptGeneratorService.synthesizeAllSegmentAudios(script);

    const cloudStorage = new CloudStorage();
    for (const segment of synthesizedScript.segments!) {
      const { fileName } = await cloudStorage.uploadBuffer(
        process.env.CS_BUCKET_NAME!,
        segment.audioContent!,
        `${script.scriptId}/${segment.index}.mp3`
      );

      segment.csAudioUrl = fileName;
      segment.audioContent = undefined;
    }

    await this._updateVideoScriptAndNotify({
      ...script,
      segments: synthesizedScript.segments,
      status: 'audio-synthesized',
    });
  }

  async enrichScriptWithVideos(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const generatedScript =
      await videoScriptGeneratorService.enrichScriptWithVideos(script);

    await this._updateVideoScriptAndNotify({
      ...script,
      segments: generatedScript.segments,
      status: 'video-enriched',
    });
  }

  async generateScript(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const generatedScript =
      await videoScriptGeneratorService.generateVideoScript({
        title: script.title,
        description: script.description,
      });

    await this._updateVideoScriptAndNotify({
      ...script,
      segments: generatedScript.segments,
      status: 'generated',
    });
  }

  private async _updateVideoScriptAndNotify(
    script: IVideoScript
  ): Promise<void> {
    await this.db.updateVideoScript(script.scriptId, script);

    this.pubSubService.publishVideoScriptToPubSub(script);
  }
}
