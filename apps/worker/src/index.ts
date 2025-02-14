const worker = async () => {
  // Get command line arguments (skip first two as they are node path and script path)
  const args = process.argv.slice(2);

  // Check if font file exists
  const fs = require('fs');
  const fontPath = './ffmpeg_fonts/Poppins-Black.ttf';

  if (!fs.existsSync(fontPath)) {
    console.error(`Font file not found: ${fontPath}`);
    process.exit(1);
  }

  console.log('Worker started');
  console.log('Arguments received:', args);
  console.log('Worker finished');
};

worker();
