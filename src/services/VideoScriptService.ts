import { IVideoScript } from '@/models';
import { ICreatedVideoScript } from './DatabaseService';
import { DatabaseService } from './DatabaseService';
import { PubSubService } from './PubSubService';

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
}
