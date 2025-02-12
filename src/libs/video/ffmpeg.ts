import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';

export interface ISubtitleEmbedOptions {
  jobId: string;
  inputVideoFilename: string;
  tmpPath: string;
  segmentIndex: number;
  assContent: string;
  outputVideoFilename: string;
  subtitleLanguage?: string;
  audioContent?: Buffer;
}

export class FFmpegProcessor {
  public async mergeVideos(options: {
    videoUrls: string[];
    outputFile: string;
    resolution?: { width: number; height: number };
    transitionEffect?: string;
    transitionDuration?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (options.videoUrls.length === 0) {
        return reject(new Error('No video URLs provided.'));
      }

      // Build the base FFmpeg command with input files.
      let command = 'ffmpeg';
      options.videoUrls.forEach((url) => {
        command += ` -i "${url}"`;
      });

      // Construct the filter_complex string.
      // For each video input, scale, pad, and set the sample aspect ratio.
      const defaultResolution = options.resolution ?? {
        width: 1920,
        height: 1080,
      };
      let filterComplex = '';
      options.videoUrls.forEach((_, index) => {
        filterComplex += `[${index}:v]scale=${defaultResolution.width}:${defaultResolution.height}:force_original_aspect_ratio=decrease,`;
        filterComplex += `pad=${defaultResolution.width}:${defaultResolution.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${index}]; `;
      });

      // Build the concatenation part.
      // For each video, add the processed video ([vX]) and the corresponding audio ([X:a]).
      let concatInputs = '';
      for (let i = 0; i < options.videoUrls.length; i++) {
        concatInputs += `[v${i}][${i}:a]`;
      }
      filterComplex += `${concatInputs}concat=n=${options.videoUrls.length}:v=1:a=1[outv][outa]`;

      // Add the filter_complex option to the command.
      // We wrap the filter_complex string in double quotes.
      command += ` -filter_complex "${filterComplex}"`;

      // Map the concatenated streams and specify output encoding options.
      command += ` -map "[outv]" -map "[outa]" `;
      command += `-c:v libx264 -crf 23 -preset veryfast `;
      command += `-c:a aac -b:a 128k `;
      command += `"${options.outputFile}"`;

      console.log('Executing command:\n', command);

      // Execute the command.
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error executing FFmpeg command:', error);
          console.error('FFmpeg stderr:', stderr);
          return reject(error);
        }
        console.log('FFmpeg stdout:', stdout);
        console.log('FFmpeg stderr:', stderr);
        resolve();
      });
    });
  }

  public async mergeVideosOld(
    inputVideos: string[],
    outputVideo: string
  ): Promise<void> {
    // Create temp file in same directory as output video
    const tempFilePath = path.join(
      path.dirname(outputVideo),
      `concat-input-${Date.now()}.txt`
    );

    try {
      // Build the content for the temporary file
      const fileContent = inputVideos
        .map((video) => `file '${video}'`)
        .join('\n');
      await fs.promises.writeFile(tempFilePath, fileContent);

      // Execute the FFmpeg command
      await new Promise<void>((resolve, reject) => {
        const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${tempFilePath}" -c:v libx264 -cpu-used 8 -b:v 0 -crf 23 -threads 8 -preset veryfast "${outputVideo}"`;
        console.log('Executing command:', ffmpegCommand);

        exec(ffmpegCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('Error during FFmpeg execution:', error);
            console.error('FFmpeg stderr:', stderr);
            return reject(error);
          }

          console.log('FFmpeg stdout:', stdout);
          console.log('FFmpeg stderr:', stderr);
          resolve();
        });
      });
    } catch (error) {
      throw error;
    } finally {
      // Clean up temporary file
      // await fs.promises.unlink(tempFilePath).catch((err) => {
      //     console.warn('Failed to delete temporary concat file:', err);
      // });
    }
  }

  public async convertMkvToMp4(
    inputPath: string,
    outputPath: string,
    options: {
      burnSubtitles?: boolean; // whether to burn subtitles into video
      keepSubtitles?: boolean; // whether to keep subtitles as separate track
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg().input(inputPath).outputOptions([
        '-c:v',
        'copy', // copy video stream (no re-encoding)
        '-c:a',
        'copy', // copy audio stream (no re-encoding)
      ]);

      // Handle subtitles
      if (options.burnSubtitles) {
        // Burns subtitles into the video stream
        command.outputOptions(['-vf', `subtitles=${inputPath}`]);
      } else if (options.keepSubtitles) {
        // Converts subtitles to MP4-compatible format
        command.outputOptions(['-c:s', 'mov_text']);
      }

      command
        .output(outputPath)
        .on('end', () => {
          console.log('Conversion finished successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error during conversion:', err);
          reject(err);
        })
        .run();
    });
  }

  public async embedSubtitleTrack(
    options: ISubtitleEmbedOptions
  ): Promise<void> {
    const { inputVideoFilename, outputVideoFilename } = options;

    const tempSubtitlePath = path.join(
      options.tmpPath,
      `subtitles-${options.jobId}-${options.segmentIndex}.ass`
    );
    const tempAudioPath = options.audioContent
      ? path.join(
          options.tmpPath,
          `audio-${options.jobId}-${options.segmentIndex}.mp3`
        )
      : null;

    await fs.promises.writeFile(tempSubtitlePath, options.assContent, 'utf8');
    if (tempAudioPath && options.audioContent) {
      await fs.promises.writeFile(tempAudioPath, options.audioContent);
    }

    const ffmpegArgs = [
      '-stream_loop',
      '-1',
      '-i',
      inputVideoFilename,
      '-i',
      tempAudioPath!,
      '-y',
      '-map',
      '0:v',
      '-map',
      '1:a',
      '-af',
      'apad=pad_dur=2',
      '-shortest',
      '-c:a',
      'aac',
      '-preset',
      'veryfast',
      '-movflags',
      '+faststart',
      '-vf',
      `subtitles=${tempSubtitlePath}`,
      outputVideoFilename,
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  public async embedSubtitleTrackOld(
    options: ISubtitleEmbedOptions
  ): Promise<void> {
    const tempSubtitlePath = path.join(
      options.tmpPath,
      `subtitles-${options.jobId}-${options.segmentIndex}.ass`
    );
    const tempAudioPath = options.audioContent
      ? path.join(
          options.tmpPath,
          `audio-${options.jobId}-${options.segmentIndex}.mp3`
        )
      : null;

    try {
      await fs.promises.writeFile(tempSubtitlePath, options.assContent, 'utf8');
      if (tempAudioPath && options.audioContent) {
        await fs.promises.writeFile(tempAudioPath, options.audioContent);
      }

      const videoDuration = await this._getDuration(options.inputVideoFilename);
      const audioDuration = tempAudioPath
        ? await this._getDuration(tempAudioPath)
        : 0;

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg().input(options.inputVideoFilename);

        if (
          tempAudioPath &&
          audioDuration > 0 &&
          audioDuration < videoDuration
        ) {
          command.inputOptions(['-stream_loop', '-1']);
        }

        // Add audio input if provided
        if (tempAudioPath) {
          command
            .input(tempAudioPath)
            .outputOptions([
              '-map 0:v',
              '-map 1:a',
              '-af',
              'apad=pad_dur=2',
              '-shortest',
            ]);
        }

        command
          .outputOptions([
            '-c:a',
            tempAudioPath ? 'aac' : 'copy', // Re-encode audio if new track added
            '-preset',
            'veryfast',
            '-movflags',
            '+faststart',
            '-vf',
            `subtitles=${tempSubtitlePath}`,
            ...(options.subtitleLanguage
              ? [
                  '-metadata:s:s:0',
                  `language=${options.subtitleLanguage ?? 'en'}`,
                ]
              : []),
          ])
          .on('start', (commandLine: string) => {
            console.log('Spawned FFmpeg with command: ' + commandLine);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('Error: ' + err.message);
            console.error('FFmpeg stderr: ' + stderr);
            reject(err);
          })
          .on('end', () => {
            console.log('Finished processing with embedded subtitle track.');
            resolve();
          })
          .save(options.outputVideoFilename);
      });
    } catch (e) {
      console.error('Error embedding subtitle track:', e);
      throw e;
    } finally {
      // Clean up temporary files
      // await Promise.all(
      //     [
      //         fs.promises.unlink(tempSubtitlePath).catch((err) => {
      //             console.warn('Failed to delete temporary subtitle file:', err);
      //         }),
      //         tempAudioPath &&
      //             fs.promises.unlink(tempAudioPath).catch((err) => {
      //                 console.warn('Failed to delete temporary audio file:', err);
      //             }),
      //     ].filter(Boolean),
      // );
    }
  }

  private async _getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        if (metadata && metadata.format && metadata.format.duration) {
          resolve(metadata.format.duration);
        } else {
          reject(
            new Error(`Could not determine duration for file: ${filePath}`)
          );
        }
      });
    });
  }
}
