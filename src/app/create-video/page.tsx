'use client';

import { VideoProvider } from '../../contexts/VideContext';
import VideoCreationStepper from '../page-components/VideoCreation/VideoCreationStepper';

export default function CreateVideo() {
  return (
    <VideoProvider>
      <VideoCreationStepper />
    </VideoProvider>
  );
}
