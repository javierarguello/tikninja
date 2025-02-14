'use client';

import React, { useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { motion } from 'framer-motion';
import { IFrontScriptSegment, useVideo } from '../../../contexts/VideContext';
import FirstStep from './FirstStep';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { steps } from './videoCreationModels';
import SecondStep from './SecondStep';
import ThirdStep from './ThirdStep';
import GeneratingWait from './GeneratingWait';
import LastStep from './LastStep';

const VideoCreationStepper: React.FC = ({}) => {
  const {
    currentStep,
    setCurrentStep,
    videoData,
    setVideoData,
    isGeneratingScript,
    setIsGeneratingScript,
  } = useVideo();
  const { toast } = useToast();

  useEffect(() => {
    if (currentStep === 3) {
      generateScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const generateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const response = await fetch('/api/video-scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description,
          language: videoData.language,
          format: videoData.format,
          voiceId: videoData.speaker,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const { scriptId } = (await response.json()) as { scriptId: string };

      setVideoData({
        ...videoData,
        scriptId,
        status: 'generating',
      });

      // Poll for status until it's complete or failed
      while (true) {
        const statusResponse = await fetch(
          `/api/video-scripts/${scriptId}/status`
        );
        const { status } = (await statusResponse.json()) as {
          status: string;
          script?: string;
        };

        if (status === 'failed') {
          throw new Error('Script generation failed');
        }

        if (
          status !== 'pending' &&
          status !== 'generated' &&
          status !== 'unknown'
        ) {
          const scriptResponse = await fetch(`/api/video-scripts/${scriptId}`);
          const { script } = (await scriptResponse.json()) as {
            script: {
              title: string;
              description: string;
              status: string;
              segments: IFrontScriptSegment[];
            };
          };

          setVideoData({
            ...videoData,
            segments: script.segments,
            status: script.status as any,
          });
          setCurrentStep(4);
          break;
        }

        // Wait for 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error('Script generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate script. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep(2); // Go back to voice selection
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!videoData.title.trim() || !videoData.language) {
          toast({
            title: 'Required Fields',
            description: 'Please enter a title',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 1:
        if (!videoData.format) {
          toast({
            title: 'Required Field',
            description: 'Please select a video format',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 2:
        if (!videoData.speaker) {
          toast({
            title: 'Required Field',
            description: 'Please select a speaker voice',
            variant: 'destructive',
          });
          return false;
        }
        break;
    }
    return true;
  };

  return (
    <div className="w-full py-8 container max-w-4xl text-left">
      <Card className="p-6 glass-card rounded-2xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-foreground text-transparent bg-clip-text">
              {steps[currentStep]}
            </h2>
            <span className="text-sm font-medium text-muted-foreground px-4 py-2 bg-secondary rounded-full">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <motion.div
          className="wizard-step min-h-[300px]"
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && <FirstStep />}
          {currentStep === 1 && <SecondStep />}
          {currentStep === 2 && <ThirdStep />}
          {currentStep === 3 && <GeneratingWait />}
          {currentStep === 4 && <LastStep />}
        </motion.div>

        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button
            variant="outline"
            disabled={currentStep === 0}
            onClick={handleBack}
            className="hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            disabled={currentStep === steps.length - 1}
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Generate Video' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VideoCreationStepper;
