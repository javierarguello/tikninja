import { PubSub } from '@google-cloud/pubsub';
import { IVideoScript } from '@/models';

export class PubSubService {
  constructor(private readonly pubSub: PubSub = new PubSub()) {}

  static deserializeMessage<T = unknown>(message: {
    data: string;
  }): Promise<T | null> {
    const data = message.data
      ? Buffer.from(message.data, 'base64').toString()
      : null;

    return data ? JSON.parse(data) : null;
  }

  async publishVideoScriptToPubSub(script: IVideoScript) {
    const topicName = process.env.VIDEO_PROCESSING_TOPIC!;

    const messageData = {
      scriptId: script.scriptId,
    };

    await this.pubSub.topic(topicName).publishMessage({
      data: Buffer.from(JSON.stringify(messageData)),
    });
  }
}
