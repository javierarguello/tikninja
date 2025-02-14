'use client';

import { useEffect } from 'react';
import { IFrontScriptSegment, VideoProvider } from '@/contexts/VideContext';
import VideoCreationStepper from './VideoCreationStepper';
import { useSearchParams } from 'next/navigation';

export function VideoCreationContainer() {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');

  useEffect(() => {
    if (scriptId) {
      getScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  const getScript = async () => {
    const scriptResponse = await fetch(`/api/video-scripts/${scriptId}`);
    const { script } = (await scriptResponse.json()) as {
      script: {
        title: string;
        description: string;
        status: string;
        segments: IFrontScriptSegment[];
      };
    };
    console.log('script', script);
  };

  return (
    <VideoProvider>
      <VideoCreationStepper />
    </VideoProvider>
  );
}

export default VideoCreationContainer;
