import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  videoData: VideoData;
  setVideoData: (data: VideoData) => void;
  videoHistory: VideoData[];
  addToHistory: (video: VideoData) => void;
}

interface VideoData {
  id?: string;
  title: string;
  description: string;
  format: 'tiktok' | 'youtube' | '';
  language: string;
  speaker: string;
  script: ScriptSegment[];
  status: 'draft' | 'generating' | 'completed';
  createdAt?: Date;
}

interface ScriptSegment {
  text: string;
  video: string;
  duration: number;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [videoData, setVideoData] = useState<VideoData>({
    title: '',
    description: '',
    format: '',
    language: 'en-US', // Set default language to English (US)
    speaker: '',
    script: [],
    status: 'draft',
  });
  const [videoHistory, setVideoHistory] = useState<VideoData[]>([]);

  const addToHistory = (video: VideoData) => {
    setVideoHistory((prev) => [
      {
        ...video,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  return (
    <VideoContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        videoData,
        setVideoData,
        videoHistory,
        addToHistory,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};
