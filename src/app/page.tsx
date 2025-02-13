'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-accent/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 p-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Create Amazing Videos with AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Turn your ideas into professional videos in minutes. Perfect for
          TikTok and YouTube content.
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
      </motion.div>
    </div>
  );
}
