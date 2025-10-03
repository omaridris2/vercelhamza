import React, { useState, useRef, useEffect } from 'react'
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import DraggableCube from './DraggableCube';
import DroppableTick from './DroppableTick';
import NewJobForm from './NewJobForm';
import { fetchOrders } from '@/app/actions/orderActions';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

interface UserTableProps {
  users: User[];
  assignedUsers: { [key: string]: string | null };
  onAssignUser: (cubeId: string, userId: string | null) => void;
  loading?: boolean;
}

type CubeType = "Roland" | "Digital" | "Sing" | "Laser" | "Wood" | "Reprint";

const CUBE_TYPES: CubeType[] = ["Roland", "Digital", "Sing", "Laser", "Wood", "Reprint"];

const Timeline: React.FC<UserTableProps> = ({ users, loading }) => {
  const [activeTab, setActiveTab] = useState<'task creation' | 'user management' | 'task tracking'>('task creation');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeFilters, setActiveFilters] = useState<CubeType[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
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
    orderno: string;
    size: string;
    type: string;
    completed: boolean;
    orderData?: any; // Store full order data for viewing
  }[]>([]);

  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});
  const [showMenu, setShowMenu] = useState(false);

  // Fetch orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    console.log('Loading orders...');
    const result = await fetchOrders();
    console.log('Fetch result:', result);
    
    if (result.success && result.orders && result.orders.length > 0) {
      const orderCubes = result.orders.map((order: any) => {
        const orderItem = order.order_items?.[0];
        const product = orderItem?.products;
        
        return {
          id: `order-${order.id}`,
          tickId: null,
          title: product?.name || 'Order',
          orderno: order.id.toString(),
          size: `Qty: ${order.Quantity || 1}`,
          type: 'Roland', // Default type - you can change this based on product
          completed: order.status === 'completed',
          orderData: order
        };
      });
      
      console.log('Created order cubes:', orderCubes);
      setCubes(orderCubes);
    } else {
      console.log('No orders found or fetch failed');
    }
  };

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

  const getFilteredCubes = () => {
    if (showAllTypes || activeFilters.length === 0) {
      return cubes;
    }
    return cubes.filter(cube => activeFilters.includes(cube.type as CubeType));
  };

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

  const handleAssignUser = (cubeId: string, userId: string | null) => {
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
  };

  const handleAddJob = () => {
    setShowMenu(true);
  };

  const handleJobSubmit = (jobData: { 
    id: string;
    title: string; 
    orderno: string;
    size: string;
    type: string;
    deadline: number;
  }) => {
    const newCube = {
      ...jobData,
      tickId: null,
      completed: false
    };
    setCubes(prev => [...prev, newCube]);
    setShowMenu(false);
  };

  const moveCubeToTimeline = (cubeId: string) => {
    const tickCounts = TICKS.map((_, i) => {
      const tickId = `tick-${i}`;
      const cubesInTick = cubes.filter(c => c.tickId === tickId).length;
      return { tickId, count: cubesInTick };
    });

    const availableTick = tickCounts.sort((a, b) => a.count - b.count)[0];

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
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            const tabs = ['task creation', 'user management', 'task tracking'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            setActiveTab(tabs[newIndex]);
          }}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          title="Previous tab"
        >
          &#8592;
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>

        <button
          onClick={() => {
            const tabs = ['task creation', 'user management', 'task tracking'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            setActiveTab(tabs[newIndex]);
          }}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          title="Next tab"
        >
          &#8594;
        </button>
      </div>
      
      {activeTab === 'task creation' && (
       <div className="">
        <NewJobForm
         onSubmit={handleJobSubmit}
         />
         
        <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 ">Task Queue - Click To Drop</h3>
        <div className="min-h-[10px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                    orderData={cube.orderData}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        </div> 
      )}

      {activeTab === 'task tracking' && (
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
      )}
      
      <div className='flex gap-20 mb-4'>
        <div className="text-2xl ">Total Tasks: {filteredCubes.length}</div>
        <div className="text-2xl ">Tasks Completed: {filteredCubes.filter(c => c.completed).length}</div>
        <div className="text-2xl ">Missed Tasks: {filteredCubes.filter(c => !c.completed).length}</div>
        <div className="text-2xl ">In Progress: {filteredCubes.filter(c => !c.completed && c.tickId !== null).length}</div>
      </div>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
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

        <div 
          ref={scrollRef}
          className="overflow-x-auto overflow-y-visible scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-max mt-70">
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
                          orderData={cube.orderData}
                        />
                      </div>
                    ))}
                  </DroppableTick>
                );
              })}
            </div>
                    
            <div className="border-t-4 border-dashed border-gray-300 w-full min-w-[3700px]" />

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
export default Timeline;