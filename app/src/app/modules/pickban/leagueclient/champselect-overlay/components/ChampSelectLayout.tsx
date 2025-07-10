import React from 'react';
import { motion } from 'framer-motion';

type ChampSelectLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  above?: React.ReactNode;
};

export const ChampSelectLayout: React.FC<ChampSelectLayoutProps> = ({ left, center, right, above }) => {
  return (
    <motion.div 
      initial={{ y: 200, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      className="fixed bottom-0 left-0 w-full z-10"
    >
      {above && <div className="w-full">{above}</div>}
      <div className="w-full flex flex-row items-end justify-between">
        <div className="flex-1 flex justify-start">
          {left}
        </div>
        <div className="flex-shrink-0">
          {center}
        </div>
        <div className="flex-1 flex justify-end">
          {right}
        </div>
      </div>
    </motion.div>
  );
};
