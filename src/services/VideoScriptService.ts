import { IVideoScript } from '@/models';
import { ICreatedVideoScript } from './DatabaseService';
import { DatabaseService } from './DatabaseService';
import { PubSubService } from './PubSubService';
import { VideoScriptGeneratorService } from '../libs/video/VideoScriptGeneratorService';

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
    }
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
