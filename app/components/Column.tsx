import React from 'react'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const Column = ({ tasks }) => {
  return (
    <div className="bg-blue-500 w-64 min-h-40 p-4 text-white rounded space-y-2">
      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white text-black rounded p-2 shadow"
        >
          {task.title}
        </div>
      ))}
      </SortableContext>
    </div>
  );
};

export default Column;
