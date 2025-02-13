'use client';

import { VideoProvider } from '../../contexts/VideContext';
import VideoCreationStepper from '../page-components/VideoCreation/VideoCreationStepper';

export default function CreateVideo() {
  return (
    <VideoProvider>
      <main className="flex min-h-screen flex-col items-center p-24">
        <VideoCreationStepper />
      </main>
    </VideoProvider>
  );
}
