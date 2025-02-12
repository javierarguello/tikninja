import { v1beta1 } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';

export class GcpTextToSpeech {
  private client: v1beta1.TextToSpeechClient;

  constructor() {
    this.client = new v1beta1.TextToSpeechClient();
  }

  /**
   * Converts text to speech using Google Cloud TTS
   * @param text - The text to convert to speech
   * @param options - Optional configuration for the speech synthesis
   * @returns Promise containing the audio content as a Buffer
   */
  async synthesizeSpeech(
    text: string,
    options: {
      languageCode?: string;
      name?: string;
      gender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
    } = {}
  ): Promise<{ audioContent: Buffer; assContent: string }> {
    const request: google.cloud.texttospeech.v1beta1.ISynthesizeSpeechRequest =
      {
        input: { ssml: this.formatTextWithMarks(text) },
        voice: {
          languageCode: options.languageCode || 'en-US',
          name: options.name || 'en-US-Standard-F',
          ssmlGender: options.gender || 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
        enableTimePointing: [
          'SSML_MARK' as unknown as google.cloud.texttospeech.v1beta1.SynthesizeSpeechRequest.TimepointType,
        ],
      };

    try {
      const [response] = await this.client.synthesizeSpeech(request);
      const timepoints =
        response.timepoints?.map((tp) => ({
          time: Number(tp.timeSeconds),
          markName: tp.markName || '',
        })) || [];

      return {
        audioContent: response.audioContent as Buffer,
        assContent: this.generateAssSubtitles(text, timepoints),
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  /**
   * Formats text with SSML marks for each word
   * @param text - The text to format with SSML marks
   * @returns The text wrapped in SSML marks with a mark after each word
   */
  formatTextWithMarks(text: string): string {
    const words = text.trim().split(/\s+/);
    const markedWords = words.map(
      (word, index) => `${word}<mark name="${index + 1}"/>`
    );

    return `<speak>${markedWords.join('')}</speak>`;
  }

  /**
   * Converts timepoints to ASS subtitle format
   * @param timepoints - Array of timepoints with time and markName
   * @returns ASS subtitle file content as string
   */
  generateAssSubtitles(
    text: string,
    timepoints: Array<{ time: number; markName: string }>
  ): string {
    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Poppins,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    const words = text.toUpperCase().trim().split(/\s+/);
    const events: string[] = [];

    const groupedWords = this.groupWords(words);

    let lastGroupIndex = 0;
    let lastWordIndexInGroup = 0;
    for (let index = 0; index < timepoints.length; index++) {
      const point = timepoints[index];
      const startTime = this.formatAssTime(point.time);
      const endTime = this.formatAssTime(
        index < timepoints.length - 1
          ? timepoints[index + 1].time
          : point.time + 1
      );
      const groupOfWords = groupedWords.find((group) => group.maxIndex > index);
      const groupIndex = groupOfWords?.maxIndex || 0;
      if (groupIndex !== lastGroupIndex) {
        lastGroupIndex = groupIndex;
        lastWordIndexInGroup = 0;
      } else {
        lastWordIndexInGroup++;
      }
      const text = groupOfWords?.words
        .map((word, i) =>
          i === lastWordIndexInGroup
            ? `{\\3c&H00FFFF&\\3a&H128&}${word}{\\3c\\3a}`
            : word
        )
        .join(' ');
      events.push(
        `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`
      );
    }

    return header + events.join('\n');
  }

  /**
   * Groups words into chunks of 15-20 characters maximum
   * @param words - Array of words to group
   * @returns Array of grouped words as strings
   */
  private groupWords(
    words: string[],
    maxLength: number = 20
  ): { maxIndex: number; words: string[] }[] {
    const groups: { maxIndex: number; words: string[] }[] = [];
    let currentGroup: string[] = [];
    let currentGroupLength = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentGroupLength +=
        currentGroupLength > 0 ? word.length + 1 : word.length; // plus 1 for the space
      if (currentGroupLength >= maxLength) {
        groups.push({ maxIndex: i, words: currentGroup });
        currentGroup = [];
        currentGroupLength = 0;
      }
      currentGroup.push(word);
    }

    if (currentGroup) {
      groups.push({ maxIndex: words.length, words: currentGroup });
    }

    return groups;
  }

  /**
   * Formats time in seconds to ASS timestamp format (H:MM:SS.cc)
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  private formatAssTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds * 100) % 100);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
}
