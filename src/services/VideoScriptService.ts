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

  async getVideoScript(scriptId: string): Promise<IVideoScript> {
    const script = await this.db.getVideoScriptById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }
    return script;
  }

  async getVideoScriptStatus(scriptId: string): Promise<string> {
    return this.db.getVideoScriptStatus(scriptId);
  }

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
      await this.generateScript(script, { triggerNextStep: true });
    } else if (script.status === 'generated') {
      await this.enrichScriptWithVideos(script, { triggerNextStep: false });
    } else if (script.status === 'video-enriched') {
      await this.synthesizeAudioForAllSegments(script);
    } else if (script.status === 'audio-synthesized') {
      await this.downloadAllSegmentVideos(script);
    } else if (script.status === 'videos-downloaded') {
      await this.addAudioToAllSegmentVideos(script);
    }
  }

  async addAudioToAllSegmentVideos(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const tmpPath = await videoScriptGeneratorService.setupTmpDir(script);
    try {
      const cloudStorage = new CloudStorage();

      for (const segment of script.segments!) {
        const localAudioPath = await cloudStorage.downloadFile(
          process.env.CS_BUCKET_NAME!,
          `${script.scriptId}/${segment.index}.mp3`,
          tmpPath
        );

        segment._localAudioPath = localAudioPath;
        segment._audioContent = undefined;

        const localVideoPath = await cloudStorage.downloadFile(
          process.env.CS_BUCKET_NAME!,
          `${script.scriptId}/${segment.index}.mp4`,
          tmpPath
        );

        segment._localVideoPath = localVideoPath;
      }

      const scriptWithAudio =
        await videoScriptGeneratorService.addAudioToAllSegmentVideos(
          tmpPath,
          script
        );

      for (const segment of scriptWithAudio.segments!) {
        const cloudStorage = new CloudStorage();
        const { fileName } = await cloudStorage.uploadFile(
          process.env.CS_BUCKET_NAME!,
          segment._localVideoPath!,
          `${script.scriptId}/${segment.index}.mp4`
        );

        segment.csVideoUrl = fileName;
        segment._localAudioPath = undefined;
        segment._localVideoPath = undefined;
      }

      await this._updateVideoScriptAndNotify({
        ...script,
        segments: scriptWithAudio.segments,
        status: 'audio-merged-into-videos',
      });
    } finally {
      try {
        await fs.promises.rm(tmpPath, { recursive: true, force: true });
      } catch (error) {
        console.error('Error deleting tmp directory:', error);
      }
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
          segment._localVideoPath!,
          `${script.scriptId}/${segment.index}.mp4`
        );

        segment.csVideoUrl = fileName;
        segment._localVideoPath = undefined;
      }

      await this._updateVideoScriptAndNotify({
        ...script,
        segments: downloadedScript.segments,
        status: 'videos-downloaded',
      });
    } finally {
      try {
        await fs.promises.rm(tmpPath, { recursive: true, force: true });
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
        segment._audioContent!,
        `${script.scriptId}/${segment.index}.mp3`
      );

      segment.csAudioUrl = fileName;
      segment._audioContent = undefined;
    }

    await this._updateVideoScriptAndNotify({
      ...script,
      segments: synthesizedScript.segments,
      status: 'audio-synthesized',
    });
  }

  async enrichScriptWithVideos(
    script: IVideoScript,
    options: { triggerNextStep?: boolean } = { triggerNextStep: false }
  ): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const generatedScript =
      await videoScriptGeneratorService.enrichScriptWithVideos(script);

    if (options?.triggerNextStep) {
      await this._updateVideoScriptAndNotify({
        ...script,
        segments: generatedScript.segments,
        status: 'video-enriched',
      });
    }
  }

  async generateScript(
    script: IVideoScript,
    options: { triggerNextStep?: boolean } = { triggerNextStep: false }
  ): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const generatedScript =
      await videoScriptGeneratorService.generateVideoScript({
        title: script.title,
        description: script.description,
      });

    if (options?.triggerNextStep) {
      await this._updateVideoScriptAndNotify({
        ...script,
        segments: generatedScript.segments,
        status: 'generated',
      });
    }
  }

  private async _updateVideoScriptAndNotify(
    script: IVideoScript
  ): Promise<void> {
    await this.db.updateVideoScript(script.scriptId, script);

    this.pubSubService.publishVideoScriptToPubSub(script);
  }
}
