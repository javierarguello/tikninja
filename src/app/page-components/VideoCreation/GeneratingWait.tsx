'use client';

import React from 'react';
import { useVideo } from '../../../contexts/VideContext';
import { Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SecondStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <Wand2 className="w-12 h-12 animate-pulse text-primary" />
        </div>
      </motion.div>
      <h3 className="text-xl font-medium">Generating Your Script</h3>
      <p className="text-muted-foreground max-w-sm">
        Please wait while we craft your script based on your preferences...
      </p>
    </div>
  );
};

export default SecondStep;
