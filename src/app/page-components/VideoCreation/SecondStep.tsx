'use client';

import React from 'react';
import { useVideo } from '../../../contexts/VideContext';
import { Button } from '../../../components/ui/button';

const SecondStep: React.FC = () => {
  const { videoData, setVideoData } = useVideo();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Button
        onClick={() => setVideoData({ ...videoData, format: 'tiktok' })}
        variant={videoData.format === 'tiktok' ? 'default' : 'outline'}
        className="h-40 flex flex-col items-center justify-center"
      >
        <span className="text-2xl mb-2">TikTok</span>
        <span className="text-sm text-muted-foreground">9:16 Vertical</span>
      </Button>
      <Button
        onClick={() => setVideoData({ ...videoData, format: 'youtube' })}
        variant={videoData.format === 'youtube' ? 'default' : 'outline'}
        className="h-40 flex flex-col items-center justify-center"
      >
        <span className="text-2xl mb-2">YouTube</span>
        <span className="text-sm text-muted-foreground">16:9 Horizontal</span>
      </Button>
    </div>
  );
};

export default SecondStep;
