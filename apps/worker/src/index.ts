import { VideoScriptService } from '@tikninja-app/video-scripts';

const worker = async () => {
  // Get command line arguments (skip first two as they are node path and script path)
  const args = process.argv.slice(2);

  console.log('Worker started');
  console.log('Arguments received:', args);

  if (args.length < 2) {
    console.error('Invalid number of arguments');
    process.exit(1);
  }

  const command = args[0];
  const value = args[1];

  if (command === 'scriptId') {
    console.log('Script ID:', value);
    const videoScriptService = new VideoScriptService();
    const videoScript = await videoScriptService.getVideoScript(value);
    console.log('Video Script:', videoScript);
  }

  console.log('Worker finished');
};

worker();
