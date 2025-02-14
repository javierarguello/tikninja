import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  videoData: IFrontVideoScript;
  setVideoData: (data: IFrontVideoScript) => void;
  videoHistory: IFrontVideoScript[];
  addToHistory: (video: IFrontVideoScript) => void;
  isGeneratingScript: boolean;
  setIsGeneratingScript: (value: boolean) => void;
}

export interface IFrontVideoScript {
  scriptId?: string;
  title: string;
  description: string;
  format: 'tiktok' | 'youtube' | '';
  language: string;
  speaker: string;
  segments: IFrontScriptSegment[];
  status: 'draft' | 'generating' | 'completed';
  createdAt?: Date;
}

export interface IFrontScriptSegment {
  subtitles: string;
  videoUrl: string;
  videoThumbnailUrl: string;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [videoData, setVideoData] = useState<IFrontVideoScript>({
    title: '',
    description: '',
    format: '',
    language: 'en-US',
    speaker: '',
    segments: [],
    status: 'draft',
  });
  const [videoHistory, setVideoHistory] = useState<IFrontVideoScript[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const addToHistory = (video: IFrontVideoScript) => {
    setVideoHistory((prev) => [
      {
        ...video,
        scriptId: crypto.randomUUID(),
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
        isGeneratingScript,
        setIsGeneratingScript,
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
