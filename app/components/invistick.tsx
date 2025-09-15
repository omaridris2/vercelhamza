'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const Invistick = ({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    
    <div ref={setNodeRef} className="relative flex flex-col items-center">
      
      
      <div
        className={`h-20 border-l-4 transition-all duration-200 ${
          isOver ? 'border-gray-500 h-25' : 'border-gray-300 border-dashed h-20'
        }`}
      />
      
      <div className="absolute top-25 flex items-center justify-center w-full">
        {children}
      </div>
    </div>
  );
};

export default Invistick;
