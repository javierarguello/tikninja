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
    }
  }

  async generateScript(script: IVideoScript): Promise<void> {
    const videoScriptGeneratorService = new VideoScriptGeneratorService();
    const generatedScript =
      await videoScriptGeneratorService.generateVideoScript({
        title: script.title,
        description: script.description,
      });

    await this.db.updateVideoScript(script.scriptId, {
      ...script,
      segments: generatedScript.segments,
      status: 'generated',
    });
  }
}
