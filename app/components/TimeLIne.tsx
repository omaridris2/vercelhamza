import React, { useState, useRef } from 'react'
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import DraggableCube from './DraggableCube';
import DroppableTick from './DroppableTick';
import NewJobForm from './NewJobForm';

import Invistick from './invistick';

type User = {
  id: string;
  name: string;
  email: string;
  title: string;
  createdAt: Date;
};

type CubeType = "Roland" | "Digital" | "Sing" | "Laser" | "Wood" | "Reprint";

const CUBE_TYPES: CubeType[] = ["Roland", "Digital", "Sing", "Laser", "Wood", "Reprint"];

export const Timeline = () => {
  const [activeTab, setActiveTab] = useState<'task management' | 'user management' | 'task tracking'>('task management');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Add filter states
  const [activeFilters, setActiveFilters] = useState<CubeType[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);

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
  const INVITICKS = Array.from({ length: 24 });
  
  const [cubes, setCubes] = useState<{
    id: string;
    tickId: string | null;
    title: string;
    orderno: string;
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

  // Filter functions
  const toggleFilter = (type: CubeType) => {
    setActiveFilters(prev => {
      if (prev.includes(type)) {
        const newFilters = prev.filter(f => f !== type);
        setShowAllTypes(newFilters.length === 0);
        return newFilters;
      } else {
        setShowAllTypes(false);
        return [...prev, type];
      }
    });
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setShowAllTypes(true);
  };

  const showAllTypesHandler = () => {
    setActiveFilters([]);
    setShowAllTypes(true);
  };

  // Filter cubes based on active filters
  const getFilteredCubes = () => {
    if (showAllTypes || activeFilters.length === 0) {
      return cubes;
    }
    return cubes.filter(cube => activeFilters.includes(cube.type as CubeType));
  };

  // Get type-specific color classes
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Roland': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Digital': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Sing': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Laser': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Wood': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Reprint': return 'bg-[#636255] border-bg-[#636255] text-white';
      default: return 'bg-[#636255] border-bg-[#636255] text-white';
    }
  };

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

  // Update handleJobSubmit function to place new cubes in placeholder area
  const handleJobSubmit = (jobData: { 
    id: string;
    title: string; 
    orderno: string;
    size: string;
    type: string;
  }) => {
    const newCube = {
      ...jobData,
      tickId: null, // Place new cube in placeholder area initially
      completed: false
    };
    setCubes(prev => [...prev, newCube]);
    setShowMenu(false);
  };

  // NEW FUNCTION: Move cube from task queue to first available timeline slot
  const moveCubeToTimeline = (cubeId: string) => {
    // Find the first available tick (one with the fewest cubes)
    const tickCounts = TICKS.map((_, i) => {
      const tickId = `tick-${i}`;
      const cubesInTick = cubes.filter(c => c.tickId === tickId).length;
      return { tickId, count: cubesInTick };
    });

    // Sort by count to find the tick with the fewest cubes
    const availableTick = tickCounts.sort((a, b) => a.count - b.count)[0];

    // Move the cube to this tick
    setCubes(prev =>
      prev.map(cube =>
        cube.id === cubeId
          ? { ...cube, tickId: availableTick.tickId }
          : cube
      )
    );
  };

  const filteredCubes = getFilteredCubes();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Work Timeline</h2>
      
      <div className='flex gap-199'>
        
      </div>
      
      <NewJobForm
        onSubmit={handleJobSubmit}
      />
      
      {/* Filter Buttons */}
      <div className="mb-6">
        
        <div className="flex flex-wrap gap-5 ">
          <button
             onClick={showAllTypesHandler}
             className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors text-2xl ${
               showAllTypes 
                 ? 'bg-[#636255] text-white border-[#636255]'
                 : 'bg-white text-[#636255] border-[#636255] hover:bg-gray-50'
             }`}
           >
            All Types 
          </button>
          
          {CUBE_TYPES.map(type => {
            const typeCount = cubes.filter(c => c.type === type).length;
            const isActive = activeFilters.includes(type);
            
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`px-12 py-3.5 rounded-lg border-2 font-medium transition-colors text-2xl ${
                  isActive
                    ? `${getTypeColor(type)} border-current`
                    : 'bg-white text-[#636255] border-[#636255] border-2 hover:bg-gray-50'
                }`}
              >
                {type} 
              </button>
            );
          })}
        </div>
        
        
      </div>
      
      <div className='flex gap-20 mb-4'>
        <div className="text-2xl ">Total Tasks: {filteredCubes.length}</div>
        <div className="text-2xl ">Tasks Completed: {filteredCubes.filter(c => c.completed).length}</div>
        <div className="text-2xl ">Missed Tasks: {filteredCubes.filter(c => !c.completed).length}</div>
        <div className="text-2xl ">In Progress: {filteredCubes.filter(c => !c.completed && c.tickId !== null).length}</div>
      </div>

      {/* Task Placeholder Area */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Task Queue - Click To Drop</h3>
        <div className="min-h-[120px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
          {filteredCubes.filter(c => c.tickId === null).length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              {activeFilters.length > 0 
                ? `No ${activeFilters.join(', ')} tasks in queue.`
                : "No tasks in queue. Create a new task to get started."
              }
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredCubes.filter(c => c.tickId === null).map(cube => (
                <div
                  key={cube.id}
                  onClick={() => moveCubeToTimeline(cube.id)}
                  className="cursor-pointer hover:transform hover:scale-105 transition-transform"
                  title="Click to move to timeline"
                >
                  <DraggableCube 
                    id={cube.id} 
                    title={cube.title} 
                    orderno={cube.orderno}
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
            </div>
          )}
        </div>
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
          className="overflow-x-auto overflow-y-visible scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-max mt-70">
            {/* Ticks (droppable) */}
            <div className="flex justify-between items-end h-32 w-full min-w-[1200px] gap-[20px]">
              {TICKS.map((_, i) => {
                const tickId = `tick-${i}`;
                const cubesInTick = filteredCubes.filter(c => c.tickId === tickId);

                return (
                  <DroppableTick key={tickId} id={tickId}>
                    {cubesInTick.map((cube, index) => (
                      <div 
                        key={cube.id} 
                        className="absolute"
                        style={{ bottom: `${20 + (index * 160)}px` }}
                      >
                        <DraggableCube 
                          key={cube.id} 
                          id={cube.id} 
                          title={cube.title}
                          orderno={cube.orderno} 
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
            <div className="border-t-4 border-dashed border-gray-300 w-full min-w-[3700px]" />

            {/* Time Labels */}
            <div className="flex justify-between mt-2 w-full min-w-[1100px]">
              {TICKS.map((_, i) => (
                <div key={i} className="text-xs text-center w-4 font-bold">{i + 1}:00</div>
              ))}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  )
}