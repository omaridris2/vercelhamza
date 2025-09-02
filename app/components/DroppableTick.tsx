'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DroppableTick = ({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="relative flex flex-col items-center"
    >
      
      <div
        className={`h-20 w-1 transition-all duration-200 ${
          isOver ? 'bg-green-500 w-2 h-25' : 'bg-black'
        }`}
      />
      
      <div className="absolute top-25 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default DroppableTick;
