'use client';

import React, { useState } from 'react';
import { useVideo } from '../../../contexts/VideContext';
import { Button } from '../../../components/ui/button';
import { Volume2 } from 'lucide-react';
import { Play } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { voices } from './videoCreationModels';

const ThirdStep: React.FC = () => {
  const { videoData, setVideoData } = useVideo();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <RadioGroup
        value={videoData.speaker}
        onValueChange={(value) =>
          setVideoData({ ...videoData, speaker: value })
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voices.map((voice) => (
            <Card
              key={voice.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                videoData.speaker === voice.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setVideoData({ ...videoData, speaker: voice.id })}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={voice.id} id={voice.id} />
                    <div>
                      <h3 className="font-medium">{voice.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {voice.gender} • {voice.language}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {playingVoiceId === voice.id ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default ThirdStep;
