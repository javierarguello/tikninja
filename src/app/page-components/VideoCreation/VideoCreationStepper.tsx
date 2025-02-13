'use client';

import React from 'react';
import { useToast } from '../../../hooks/use-toast';
import { motion } from 'framer-motion';
import { useVideo } from '../../../contexts/VideContext';
import FirstStep from './FirstStep';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { steps } from './videoCreationModels';
import SecondStep from './SecondStep';
import ThirdStep from './ThirdStep';
import GeneratingWait from './GeneratingWait';
import LastStep from './LastStep';

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
