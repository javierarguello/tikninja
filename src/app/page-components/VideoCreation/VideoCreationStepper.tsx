'use client';

import React from 'react';
import { useToast } from '../../../hooks/use-toast';
import { useVideo } from '../../../contexts/VideContext';
import FirstStep from './FirstStep';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { steps } from './videoCreationModels';
import SecondStep from './SecondStep';
import ThirdStep from './ThirdStep';

const VideoCreationStepper: React.FC = () => {
  const { currentStep, setCurrentStep, videoData, setVideoData } = useVideo();
  const { toast } = useToast();

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 py-8">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 glass-card">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{steps[currentStep]}</h2>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="wizard-step min-h-[300px]">
              {currentStep === 0 && <FirstStep />}
              {currentStep === 1 && <SecondStep />}
              {currentStep === 2 && <ThirdStep />}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                disabled={currentStep === 0}
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                disabled={currentStep === steps.length - 1}
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? 'Generate Video' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoCreationStepper;
