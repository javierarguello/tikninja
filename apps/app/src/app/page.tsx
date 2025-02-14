'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Create Amazing Videos with AI
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Turn your ideas into professional videos in minutes. Perfect for TikTok
        and YouTube content.
      </p>
      <div className="pt-4">
        <Button
          size="lg"
          className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          onClick={() => router.push('/create-video')}
        >
          Create Video
        </Button>
      </div>
    </div>
  );
}
