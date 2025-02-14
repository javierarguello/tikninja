// Import fetch if needed (for Node.js versions <18)
// import fetch from 'node-fetch';

import { IVideoScript, IVideoScriptSegment } from '../../models';
import { v4 as uuidv4 } from 'uuid';

export interface IChatMessage {
  role: string;
  content: string;
}

export interface IChatCompletionRequest {
  model: string;
  messages: IChatMessage[];
}

export interface IVideoScriptOptions {
  title: string;
  description?: string;
}

export interface IChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: IChoice[];
  usage: IUsage;
  service_tier: string;
  system_fingerprint: string;
}

export interface IChoice {
  index: number;
  message: IMessage;
  logprobs: null;
  finish_reason: string;
}

export interface IMessage {
  role: string;
  content: string;
  refusal: null;
}

export interface IUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: ITokenDetails;
  completion_tokens_details: ICompletionTokenDetails;
}

export interface ITokenDetails {
  cached_tokens: number;
  audio_tokens: number;
}

export interface ICompletionTokenDetails {
  reasoning_tokens: number;
  audio_tokens: number;
  accepted_prediction_tokens: number;
  rejected_prediction_tokens: number;
}

export interface IContentResponse {
  segments: IVideoScriptSegment[];
}

export class OpenAIService {
  private readonly OPENAI_API_KEY: string;

  constructor() {
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    if (!this.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
  }

  async generateVideoScript(
    options: IVideoScriptOptions
  ): Promise<IVideoScript | null> {
    const messages: IChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a creative video script writer. Generate a script for a video that lasts between 5 and 8 minutes. The script should be divided into segments representing 5 to 10 seconds of video time each. For each segment, produce highly detailed and elaborate subtitles of at least 30 words. Also, the first segment should be an catchy introduction to the video. Additionally, include an array of keywords for each segment, and each keyword must be a single word (no spaces) to assist in content search.',
      },
      {
        role: 'user',
        content: `Given the following title and optional description, create a video script. The output must be valid JSON in the following format:
                {
                "segments": [
                    {
                    "subtitles": "Some explanation of the segment here",
                    "keywords": ["keyword1", "keyword2"]
                    },
                    ...
                ]
                }

                Title: ${options.title}
                ${
                  options.description || 'Description: ' + options.description
                }`,
      },
    ];

    const requestBody: IChatCompletionRequest = {
      model: 'gpt-4o-mini',
      messages,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const completionResponse = data as IChatCompletionResponse;
    const segments = this.parseContent(
      completionResponse.choices[0].message.content
    );
    if (!segments) {
      throw new Error('No segments parsed');
    }
    return {
      scriptId: uuidv4(),
      title: options.title,
      description: options.description,
      segments,
    };
  }

  private parseContent(rawContent: string): IVideoScriptSegment[] | null {
    try {
      const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        return null;
      }

      // Parse the JSON string
      const jsonData = JSON.parse(jsonMatch[1]) as IContentResponse;
      return jsonData.segments.map((segment, index) => ({
        ...segment,
        index,
      }));
    } catch (error) {
      console.error('Failed to parse content:', error);
      return null;
    }
  }
}
