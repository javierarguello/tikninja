'use client';

import { Suspense } from 'react';
import { VideoCreationContainer } from '../page-components/VideoCreation/VideoCreationContainer';

export default function CreateVideo() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoCreationContainer />
    </Suspense>
  );
}
