'use client';

import React from 'react';
import { useVideo } from '../../../contexts/VideContext';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { RefreshCw } from 'lucide-react';
import { AspectRatio } from '../../../components/ui/aspect-ratio';

const mockScriptSegments = [
  {
    id: 1,
    text: 'Welcome to this amazing video about artificial intelligence.',
    video: '/video1.mp4',
    duration: 5,
  },
  {
    id: 2,
    text: "Today, we'll explore how AI is changing our daily lives.",
    video: '/video2.mp4',
    duration: 6,
  },
];

const LastStep: React.FC = () => {
  const { videoData, setVideoData } = useVideo();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Script Segments</h3>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate Script
        </Button>
      </div>
      <div className="space-y-6">
        {mockScriptSegments.map((segment) => (
          <Card key={segment.id} className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="flex-1 text-sm">{segment.text}</p>
                <span className="text-sm text-muted-foreground ml-4">
                  {segment.duration}s
                </span>
              </div>

              <div className="rounded-md overflow-hidden border bg-muted max-w-[240px] mx-auto">
                <AspectRatio
                  ratio={videoData.format === 'tiktok' ? 9 / 16 : 16 / 9}
                  className="bg-muted"
                >
                  <video
                    src={segment.video}
                    className="object-cover w-full h-full"
                    controls
                    muted
                    loop
                  >
                    <source src={segment.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </AspectRatio>
              </div>

              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm">
                  Change Video
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LastStep;
