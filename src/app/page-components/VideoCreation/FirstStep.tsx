'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVideo } from '../../../contexts/VideContext';
import { languages } from './videoCreationModels';

const FirstStep: React.FC = () => {
  const { videoData, setVideoData } = useVideo();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          value={videoData.title}
          onChange={(e) =>
            setVideoData({ ...videoData, title: e.target.value })
          }
          placeholder="Enter video title"
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <Textarea
          value={videoData.description}
          onChange={(e) =>
            setVideoData({ ...videoData, description: e.target.value })
          }
          placeholder="Enter video description"
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Language</label>
        <Select
          value={videoData.language}
          defaultValue="en-US"
          onValueChange={(value) =>
            setVideoData({ ...videoData, language: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FirstStep;
