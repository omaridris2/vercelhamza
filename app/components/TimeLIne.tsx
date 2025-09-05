import React, { useState, useRef } from 'react'
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import DraggableCube from './DraggableCube';
import DroppableTick from './DroppableTick';
import NewJobForm from './NewJobForm';

type User = {
  id: string;
  name: string;
  email: string;
  title: string;
  createdAt: Date;
};

export const Timeline = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      if (scrollRef.current) {
        const scrollAmount = 200; // pixels to scroll
        if (direction === "left") {
          scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    };

  const TICKS = Array.from({ length: 24 });
  
  const [cubes, setCubes] = useState<{
    id: string;
    tickId: string | null;
    title: string;
    size: string;
    type: string;
    completed: boolean;
  }[]>([]);

  // Add users state
  const [users, setUsers] = useState<User[]>([]);

  // Add state for assigned users
  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});

  // Add missing showMenu state
  const [showMenu, setShowMenu] = useState(false);

  const handleComplete = (id: string) => {
    setCubes(prev =>
      prev.map(cube =>
        cube.id === id ? { ...cube, completed: true } : cube
      )
    );
  };

  const deleteCube = (id: string) => {
    setCubes(prev => prev.filter(cube => cube.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over) {
      setCubes(prev =>
        prev.map(cube =>
          cube.id === active.id
            ? { ...cube, tickId: over.id.toString() }
            : cube
        )
      );
    }
  };

  // Handle user assignment to cube
  const handleAssignUser = (cubeId: string, userId: string | null) => {
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
  };

  // Add missing handleAddJob function
  const handleAddJob = () => {
    setShowMenu(true);
  };

  // Update handleJobSubmit function to include initial tick position
  const handleJobSubmit = (jobData: { 
    id: string;
    title: string; 
    size: string;
    type: string;
  }) => {
    const newCube = {
      ...jobData,
      tickId: `tick-0`, // Place new cube on the first tick (1:00)
      completed: false
    };
    setCubes(prev => [...prev, newCube]);
    setShowMenu(false);
  };

  return (
    <div>
      <div className='flex gap-199 mb-4'>
        <h2 className="text-2xl font-bold text-gray-900 ">Work Timeline</h2>
        <button 
          onClick={handleAddJob} 
          className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500"
        >
          Add Job
        </button>
      </div>
      
      <div className='flex gap-20 mb-5'>
        <div className="text-2xl mb-20">Total Tasks: {cubes.length}</div>
        <div className="text-2xl mb-20">Tasks Completed: {cubes.filter(c => c.completed).length}</div>
        <div className="text-2xl mb-20">Missed Tasks: {cubes.filter(c => !c.completed).length}</div>
        <div className="text-2xl mb-20">In Progress: {cubes.filter(c => !c.completed && c.tickId !== null).length}</div>
      </div>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        {/* Navigation buttons */}
        <div className="flex justify-between items-center m-4">
          <button
            onClick={() => scroll("left")}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8592;
          </button>
          
          <button
            onClick={() => scroll("right")}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8594;
          </button>
        </div>

        {/* Scrollable Timeline Container */}
        <div 
          ref={scrollRef}
          className="overflow-x-auto overflow-y-visible scrollbar-hide "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-max mt-70">
            {/* Ticks (droppable) */}
            <div className="flex justify-between items-end h-32 w-full min-w-[1200px] gap-[20px]">
              {TICKS.map((_, i) => {
                const tickId = `tick-${i}`;
                const cubesInTick = cubes.filter(c => c.tickId === tickId);

                return (
                  <DroppableTick key={tickId} id={tickId}>
                    {cubesInTick.map((cube, index) => (
                      <div 
                        key={cube.id} 
                        className="absolute"
                        style={{ bottom: `${20 + (index * 120)}px` }} // Changed from 80px to 40px
                      >
                        
                        <DraggableCube 
                          key={cube.id} 
                          id={cube.id} 
                          title={cube.title} 
                          type={cube.type} 
                          completed={cube.completed}
                          onDelete={deleteCube} 
                          onComplete={handleComplete} 
                          users={users} 
                          onAssignUser={handleAssignUser} 
                          assignedUser={users.find(u => u.id === assignedUsers[cube.id]) || null} 
                        />
                        
                      </div>
                    ))}
                  </DroppableTick>
                );
              })}
            </div>
                    
            {/* Horizontal Line */}
            <div className="h-1 w-full bg-black  min-w-[2400px]" />

            {/* Time Labels */}
            <div className="flex justify-between mt-2 w-full min-w-[1200px]">
              {TICKS.map((_, i) => (
                <div key={i} className="text-xs text-center w-4 font-bold">{i + 1}:00</div>
              ))}
            </div>
          </div>
        </div>

        {/* Unplaced Cubes */}
        <div className="flex gap-4 mt-8">
          {cubes.filter(c => c.tickId === null).map(cube => (
            <DraggableCube 
              key={cube.id} 
              id={cube.id} 
              title={cube.title} 
              type={cube.type} 
              completed={cube.completed}
              onDelete={deleteCube} 
              onComplete={handleComplete} 
              users={users} 
              onAssignUser={handleAssignUser} 
              assignedUser={users.find(u => u.id === assignedUsers[cube.id]) || null} 
            />
          ))}
        </div>
      </DndContext>

      {showMenu && (
        <NewJobForm
          onClose={() => setShowMenu(false)}
          onSubmit={handleJobSubmit}
        />
      )}
    </div>
  )
}